<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DailyAssessment;
use App\Models\StudentScore;
use App\Models\AcademicClass;
use App\Models\Subject;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $query = DailyAssessment::with(['academicClass', 'subject', 'scores'])
            ->where('teacher_id', Auth::id());

        if ($request->academic_class_id) {
            $query->where('academic_class_id', $request->academic_class_id);
        }
        if ($request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        $assessments = $query->latest()->paginate(20);

        return response()->json([
            'data' => $assessments->map(fn($a) => $this->formatAssessment($a)),
            'meta' => [
                'current_page' => $assessments->currentPage(),
                'last_page'    => $assessments->lastPage(),
                'total'        => $assessments->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'subject_id'        => 'required|exists:subjects,id',
            'date'              => 'required|date',
            'title'             => 'required|string|max:255',
            'kkm'               => 'nullable|integer|min:0|max:100',
            'scores'            => 'required|array|min:1',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.score'      => 'required|numeric|min:0|max:100',
            'scores.*.notes'      => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $assessment = DailyAssessment::create([
                'teacher_id'        => Auth::id(),
                'academic_class_id' => $validated['academic_class_id'],
                'subject_id'        => $validated['subject_id'],
                'date'              => $validated['date'],
                'title'             => $validated['title'],
                'kkm'               => $validated['kkm'] ?? null,
            ]);

            foreach ($validated['scores'] as $s) {
                StudentScore::create([
                    'daily_assessment_id' => $assessment->id,
                    'student_id'          => $s['student_id'],
                    'score'               => $s['score'],
                    'notes'               => $s['notes'] ?? null,
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Penilaian berhasil disimpan', 'data' => $this->formatAssessment($assessment->load(['academicClass', 'subject', 'scores']))], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal: ' . $e->getMessage()], 500);
        }
    }

    public function getStudents($classId)
    {
        $students = Student::whereHas('academicClasses', function ($q) use ($classId) {
            $q->where('class_members.class_id', $classId)->where('class_members.is_active', true);
        })->orderBy('name')->get(['students.id', 'students.name', 'students.nisn', 'students.photo']);
        
        $students->each->setAppends(['photo_url']);
        
        return response()->json(['data' => $students]);
    }

    public function getFormData()
    {
        return response()->json([
            'classes'  => AcademicClass::all(['id', 'name']),
            'subjects' => Subject::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $assessment = DailyAssessment::where('teacher_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'date'              => 'required|date',
            'title'             => 'required|string|max:255',
            'kkm'               => 'nullable|integer|min:0|max:100',
            'scores'            => 'nullable|array',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.score'      => 'required|numeric|min:0|max:100',
            'scores.*.notes'      => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $assessment->update([
                'date'  => $validated['date'],
                'title' => $validated['title'],
                'kkm'   => $validated['kkm'] ?? null,
            ]);

            if (!empty($validated['scores'])) {
                StudentScore::where('daily_assessment_id', $assessment->id)->delete();
                foreach ($validated['scores'] as $s) {
                    StudentScore::create([
                        'daily_assessment_id' => $assessment->id,
                        'student_id'          => $s['student_id'],
                        'score'               => $s['score'],
                        'notes'               => $s['notes'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Penilaian berhasil diperbarui', 'data' => $this->formatAssessment($assessment->load(['academicClass', 'subject', 'scores']))]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $assessment = DailyAssessment::where('teacher_id', Auth::id())->findOrFail($id);
        $assessment->delete();
        return response()->json(['message' => 'Penilaian berhasil dihapus']);
    }

    private function formatAssessment(DailyAssessment $a): array
    {
        return [
            'id'                => $a->id,
            'date'              => $a->date,
            'title'             => $a->title,
            'kkm'               => $a->kkm,
            'class_name'        => $a->academicClass?->name,
            'subject_name'      => $a->getRelationValue('subject') ? $a->getRelationValue('subject')->name : $a->subject,
            'academic_class_id' => $a->academic_class_id,
            'subject_id'        => $a->subject_id,
            'scores'            => $a->scores?->map(fn($s) => [
                'student_id' => $s->student_id,
                'score'      => $s->score,
                'notes'      => $s->notes
            ]),
            'scores_count'      => $a->scores?->count() ?? 0,
            'average_score'     => $a->scores?->avg('score') ? round($a->scores->avg('score'), 1) : null,
        ];
    }
}
