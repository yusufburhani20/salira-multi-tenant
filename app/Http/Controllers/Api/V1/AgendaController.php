<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClassAgenda;
use App\Models\AcademicClass;
use App\Models\Subject;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Enums\AttendanceStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AgendaController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassAgenda::with(['academicClass', 'subject'])
            ->where('teacher_id', Auth::id());

        if ($request->academic_class_id) {
            $query->where('academic_class_id', $request->academic_class_id);
        }
        if ($request->start_date) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $agendas = $query->latest('date')->latest('id')->paginate(20);

        return response()->json([
            'data' => $agendas->map(fn($a) => $this->formatAgenda($a)),
            'meta' => [
                'current_page' => $agendas->currentPage(),
                'last_page'    => $agendas->lastPage(),
                'total'        => $agendas->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'subject_id'        => 'required|exists:subjects,id',
            'date'              => 'required|date',
            'lesson_hour_start' => 'required|integer|min:1',
            'lesson_hour_end'   => 'required|integer|gte:lesson_hour_start',
            'topic'             => 'required|string|max:500',
            'learning_model'    => 'nullable|string',
            'activities'        => 'nullable|string',
            'attendances'       => 'nullable|array',
            'attendances.*.student_id' => 'exists:students,id',
            'attendances.*.status'     => 'in:hadir,sakit,izin,alpha',
        ]);

        $newSlots = range($validated['lesson_hour_start'], $validated['lesson_hour_end']);
        $existingAgendas = ClassAgenda::with('teacher')->where('academic_class_id', $validated['academic_class_id'])
            ->whereDate('date', $validated['date'])
            ->get();
        
        foreach ($existingAgendas as $existingAgenda) {
            $existingSlots = $this->extractSlotLabels($existingAgenda->lesson_period);
            $overlap = array_intersect($newSlots, $existingSlots);
            if (!empty($overlap)) {
                $overlapStr = implode(', ', $overlap);
                $teacherName = $existingAgenda->teacher ? $existingAgenda->teacher->name : 'Guru lain';
                return response()->json([
                    'message' => "Jam Pelajaran {$overlapStr} sudah diisi oleh {$teacherName}."
                ], 400);
            }
        }

        DB::beginTransaction();
        try {
            $agenda = ClassAgenda::create([
                'teacher_id'        => Auth::id(),
                'academic_class_id' => $validated['academic_class_id'],
                'subject_id'        => $validated['subject_id'],
                'date'              => $validated['date'],
                'lesson_period'     => $this->generateLessonPeriodString($validated['lesson_hour_start'], $validated['lesson_hour_end'], $validated['date']),
                'topic'             => $validated['topic'],
                'learning_model'    => $validated['learning_model'] ?? null,
                'activities'        => $validated['activities'] ?? null,
            ]);

            // Store student attendance if provided
            if (!empty($validated['attendances'])) {
                foreach ($validated['attendances'] as $att) {
                    StudentAttendance::updateOrCreate(
                        ['student_id' => $att['student_id'], 'date' => $validated['date']],
                        [
                            'status'         => $att['status'],
                            'class_agenda_id' => $agenda->id,
                        ]
                    );
                }
            }

            DB::commit();
            return response()->json(['message' => 'Jurnal berhasil disimpan', 'data' => $this->formatAgenda($agenda->load(['academicClass', 'subject']))], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menyimpan jurnal: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $agenda = ClassAgenda::with(['academicClass', 'subject'])->where('teacher_id', Auth::id())->findOrFail($id);
        return response()->json(['data' => $this->formatAgenda($agenda)]);
    }

    public function getStudents($id)
    {
        $agenda = ClassAgenda::where('teacher_id', Auth::id())->findOrFail($id);
        $students = Student::whereHas('academicClasses', function ($q) use ($agenda) {
            $q->where('class_id', $agenda->academic_class_id)->where('is_active', true);
        })->orderBy('name')->get(['students.id', 'students.name', 'students.nisn']);

        // Get existing attendance for this date
        $existingAttendances = StudentAttendance::where('date', $agenda->date)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->keyBy('student_id');

        $result = $students->map(fn($s) => [
            'id'     => $s->id,
            'name'   => $s->name,
            'nisn'   => $s->nisn,
            'status' => $existingAttendances[$s->id]->status ?? 'hadir',
        ]);

        return response()->json(['data' => $result]);
    }

    public function getClasses()
    {
        $classes = AcademicClass::with(['subjects:id,name'])->get(['id', 'name']);
        $subjects = Subject::orderBy('name')->get(['id', 'name']);
        
        $setting = \Illuminate\Support\Facades\DB::table('settings')->where('key', 'lesson_hours_by_day')->first();
        $maxLessonHours = 12; // default fallback
        $lessonHoursData = null;

        if ($setting && $setting->value) {
            $hoursByDay = json_decode($setting->value, true);
            $lessonHoursData = $hoursByDay;
            if (is_array($hoursByDay)) {
                $max = 0;
                foreach ($hoursByDay as $day => $hours) {
                    if (is_array($hours) && count($hours) > $max) {
                        $max = count($hours);
                    }
                }
                if ($max > 0) {
                    $maxLessonHours = $max;
                }
            }
        }

        return response()->json([
            'classes' => $classes,
            'subjects' => $subjects,
            'max_lesson_hours' => $maxLessonHours,
            'lesson_hours' => $lessonHoursData,
        ]);
    }

    public function getBookedPeriods(Request $request)
    {
        $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'date' => 'required|date',
            'exclude_agenda_id' => 'nullable|integer',
        ]);

        $query = ClassAgenda::with(['teacher:id,name', 'subject:id,name'])
            ->where('academic_class_id', $request->academic_class_id)
            ->whereDate('date', $request->date);

        if ($request->filled('exclude_agenda_id')) {
            $query->where('id', '!=', $request->exclude_agenda_id);
        }

        return response()->json($query->get());
    }

    public function update(Request $request, $id)
    {
        $agenda = ClassAgenda::where('teacher_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'date'              => 'required|date',
            'lesson_hour_start' => 'required|integer|min:1',
            'lesson_hour_end'   => 'required|integer|min:1',
            'topic'             => 'required|string|max:255',
            'learning_model'    => 'nullable|string',
            'activities'        => 'nullable|string',
            'attendances'       => 'nullable|array',
            'attendances.*.student_id' => 'exists:students,id',
            'attendances.*.status'     => 'in:hadir,sakit,izin,alpha',
        ]);

        $newSlots = range($validated['lesson_hour_start'], $validated['lesson_hour_end']);
        $existingAgendas = ClassAgenda::with('teacher')->where('academic_class_id', $agenda->academic_class_id)
            ->whereDate('date', $validated['date'])
            ->where('id', '!=', $agenda->id)
            ->get();
        
        foreach ($existingAgendas as $existingAgenda) {
            $existingSlots = $this->extractSlotLabels($existingAgenda->lesson_period);
            $overlap = array_intersect($newSlots, $existingSlots);
            if (!empty($overlap)) {
                $overlapStr = implode(', ', $overlap);
                $teacherName = $existingAgenda->teacher ? $existingAgenda->teacher->name : 'Guru lain';
                return response()->json([
                    'message' => "Jam Pelajaran {$overlapStr} sudah diisi oleh {$teacherName}."
                ], 400);
            }
        }

        DB::beginTransaction();
        try {
            $agenda->update([
                'date'              => $validated['date'],
                'lesson_period'     => $this->generateLessonPeriodString($validated['lesson_hour_start'], $validated['lesson_hour_end'], $validated['date']),
                'topic'             => $validated['topic'],
                'learning_model'    => $validated['learning_model'] ?? null,
                'activities'        => $validated['activities'] ?? null,
            ]);

            if (!empty($validated['attendances'])) {
                foreach ($validated['attendances'] as $att) {
                    StudentAttendance::updateOrCreate(
                        ['student_id' => $att['student_id'], 'date' => $validated['date']],
                        [
                            'status'         => $att['status'],
                            'class_agenda_id' => $agenda->id,
                        ]
                    );
                }
            }

            DB::commit();
            return response()->json(['message' => 'Jurnal berhasil diperbarui', 'data' => $this->formatAgenda($agenda->load(['academicClass', 'subject']))]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal memperbarui jurnal: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $agenda = ClassAgenda::where('teacher_id', Auth::id())->findOrFail($id);
        $agenda->delete();
        return response()->json(['message' => 'Jurnal berhasil dihapus']);
    }

    private function formatAgenda(ClassAgenda $a): array
    {
        $periodStr = trim(explode('(', $a->lesson_period ?? '1-1')[0]);
        if (strpos($periodStr, ',') !== false) {
            $slots = array_map('trim', explode(',', $periodStr));
            $lesson_hour_start = (int)reset($slots);
            $lesson_hour_end = (int)end($slots);
        } else if (strpos($periodStr, '-') !== false) {
            $slots = explode('-', $periodStr);
            $lesson_hour_start = (int)$slots[0];
            $lesson_hour_end = (int)($slots[1] ?? $lesson_hour_start);
        } else {
            $lesson_hour_start = (int)$periodStr;
            $lesson_hour_end = $lesson_hour_start;
        }

        $attendances = \App\Models\StudentAttendance::where('class_agenda_id', $a->id)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'id'                => $a->id,
            'date'              => $a->date,
            'topic'             => $a->topic,
            'learning_model'    => $a->learning_model,
            'activities'        => $a->activities,
            'lesson_hour_start' => $lesson_hour_start,
            'lesson_hour_end'   => $lesson_hour_end,
            'attendance_summary'=> $attendances,
            'class_name'        => $a->academicClass?->name,
            'subject_name'      => $a->getRelation('subject')?->name ?? $a->subject,
            'academic_class_id' => $a->academic_class_id,
            'subject_id'        => $a->subject_id,
            'academic_class'    => $a->academicClass ? ['id' => $a->academicClass->id, 'name' => $a->academicClass->name] : null,
            'subject'           => $a->getRelation('subject') ? ['id' => $a->subject_id, 'name' => $a->getRelation('subject')->name] : ['id' => $a->subject_id, 'name' => $a->subject],
        ];
    }

    private function extractSlotLabels($lessonPeriod)
    {
        if (empty($lessonPeriod)) return [];
        $periodStr = trim(explode('(', $lessonPeriod)[0]);
        if (strpos($periodStr, ',') !== false) {
            return array_map('trim', explode(',', $periodStr));
        } else if (strpos($periodStr, '-') !== false) {
            $slots = explode('-', $periodStr);
            return range((int)$slots[0], (int)($slots[1] ?? $slots[0]));
        } else {
            return [(int)$periodStr];
        }
    }

    private function generateLessonPeriodString($start, $end, $date)
    {
        $slots = [];
        for ($i = $start; $i <= $end; $i++) {
            $slots[] = $i;
        }
        $slotsStr = implode(', ', $slots);

        $setting = \Illuminate\Support\Facades\DB::table('settings')->where('key', 'lesson_hours_by_day')->first();
        if (!$setting || !$setting->value) {
            return $slotsStr;
        }

        $hoursByDay = json_decode($setting->value, true);
        $dayKey = strtolower(\Carbon\Carbon::parse($date)->format('l'));

        if (!isset($hoursByDay[$dayKey]) || empty($hoursByDay[$dayKey])) {
            return $slotsStr;
        }

        $daySchedule = $hoursByDay[$dayKey];
        $startTime = '00:00';
        $endTime = '00:00';

        foreach ($daySchedule as $slot) {
            if ($slot['label'] == $start) {
                $startTime = $slot['start'];
            }
            if ($slot['label'] == $end) {
                $endTime = $slot['end'];
            }
        }

        return "{$slotsStr} ({$startTime} - {$endTime})";
    }
}
