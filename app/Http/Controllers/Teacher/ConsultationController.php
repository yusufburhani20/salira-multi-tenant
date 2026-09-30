<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\StudentConsultation;
use App\Models\AcademicClass;
use App\Models\Student;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Enums\ConsultationCategory;
use App\Enums\FollowUpStatus;
use App\Enums\ConsultationPrivacy;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Notifications\PortalNotification;

use App\Http\Controllers\Concerns\ResolvesActiveSemester;

class ConsultationController extends Controller
{
    use ResolvesActiveSemester;

    public function index(Request $request)
    {
        $query = StudentConsultation::whereHas('academicClass')->with(['student', 'academicClass']);
        if (!Auth::user()->hasAnyRole(['Super Admin', 'Kepala Sekolah', 'Staff/TU'])) {
            $query->where('teacher_id', Auth::id());
        }

        // Default to active semester (scoped to active academic year)
        $semesterId = $request->input('semester_id');
        if (!$semesterId && !$request->has('start_date') && !$request->has('end_date')) {
            $activeSemester = $this->getActiveSemester();
            $semesterId = $activeSemester?->id;
        }

        // Filters
        if ($request->academic_class_id) {
            $query->where('class_id', $request->academic_class_id);
        }
        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($semesterId) {
            $selectedSemester = Semester::find($semesterId);
            if ($selectedSemester) {
                $query->whereBetween('consultation_date', [$selectedSemester->start_date, $selectedSemester->end_date]);
            }
        } else {
            if ($request->start_date) {
                $query->whereDate('consultation_date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('consultation_date', '<=', $request->end_date);
            }
        }

        $consultations = $query->latest()->paginate(15)->withQueryString();

        $classes = AcademicClass::all(); // global scope = active year only

        $categories = [];
        foreach(ConsultationCategory::cases() as $case) {
            $categories[] = ['value' => $case->value, 'label' => $case->label()];
        }

        $statuses = [];
        foreach(FollowUpStatus::cases() as $case) {
            $statuses[] = ['value' => $case->value, 'label' => $case->label()];
        }

        $filters = $request->only(['academic_class_id', 'category', 'start_date', 'end_date', 'semester_id']);
        if (!$request->has('semester_id') && !$request->has('start_date') && !$request->has('end_date')) {
            $filters['semester_id'] = $semesterId;
        }

        return Inertia::render('Teacher/Consultations/Index', [
            'consultations' => $consultations,
            'classes'       => $classes,
            'categories'    => $categories,
            'statuses'      => $statuses,
            'semesters'     => $this->getSemesterOptions(),
            'filters'       => $filters,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:academic_classes,id',
            'category' => ['required', Rule::enum(ConsultationCategory::class)],
            'consultation_date' => 'required|date',
            'subject' => 'required|string|max:255',
            'case_description' => 'required|string',
            'discussion_summary' => 'required|string',
            'follow_up_plan' => 'required|string',
            'follow_up_status' => ['required', Rule::enum(FollowUpStatus::class)],
        ]);

        $consultation = StudentConsultation::create([
            'student_id' => $validated['student_id'],
            'teacher_id' => Auth::id(),
            'class_id' => $validated['class_id'],
            'category' => $validated['category'],
            'consultation_date' => $validated['consultation_date'],
            'subject' => $validated['subject'],
            'problem_description' => $validated['case_description'],
            'advice_given' => $validated['discussion_summary'],
            'action_plan' => $validated['follow_up_plan'],
            'follow_up_status' => $validated['follow_up_status'],
            'privacy_level' => ConsultationPrivacy::normal,
        ]);

        // Notify Student
        $student = Student::find($validated['student_id']);
        if ($student) {
            $student->notify(new PortalNotification(
                "Catatan bimbingan baru telah ditambahkan: {$validated['subject']}",
                ['type' => 'consultation', 'id' => $consultation->id]
            ));
        }

        return back()->with('success', 'Catatan bimbingan berhasil disimpan.');
    }

    public function update(Request $request, StudentConsultation $consultation)
    {
        if ($consultation->teacher_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'category' => ['required', Rule::enum(ConsultationCategory::class)],
            'consultation_date' => 'required|date',
            'subject' => 'required|string|max:255',
            'case_description' => 'required|string',
            'discussion_summary' => 'required|string',
            'follow_up_plan' => 'required|string',
            'follow_up_status' => ['required', Rule::enum(FollowUpStatus::class)],
        ]);

        $consultation->update([
            'category' => $validated['category'],
            'consultation_date' => $validated['consultation_date'],
            'subject' => $validated['subject'],
            'problem_description' => $validated['case_description'],
            'advice_given' => $validated['discussion_summary'],
            'action_plan' => $validated['follow_up_plan'],
            'follow_up_status' => $validated['follow_up_status'],
        ]);

        return back()->with('success', 'Catatan bimbingan berhasil diperbarui.');
    }

    public function destroy(StudentConsultation $consultation)
    {
        if ($consultation->teacher_id !== Auth::id()) {
            abort(403);
        }

        $consultation->delete();

        return back()->with('success', 'Catatan bimbingan berhasil dihapus.');
    }

    public function exportExcel(Request $request)
    {
        $data = $this->getExportData($request);
        $className = $request->academic_class_id ? AcademicClass::find($request->academic_class_id)->name : 'Semua Kelas';
        $range = ($request->start_date ?? 'Awal') . ' - ' . ($request->end_date ?? 'Sekarang');

        $meta = [
            'school_name' => \App\Models\Setting::get('school_name', 'SALIRA ACADEMY'),
            'class_name' => $className,
            'range' => $range,
            'teacher_name' => Auth::user()->name
        ];

        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ConsultationRecapExport($data, $meta), 'rekap_bimbingan.xlsx');
    }

    public function exportPdf(Request $request)
    {
        $data = $this->getExportData($request);
        $className = $request->academic_class_id ? AcademicClass::find($request->academic_class_id)->name : 'Semua Kelas';
        $range = ($request->start_date ?? 'Awal') . ' - ' . ($request->end_date ?? 'Sekarang');
        
        $logo = \App\Models\Setting::get('school_logo');
        $logoPath = null;
        if ($logo) {
            if (file_exists(public_path('storage/' . $logo))) {
                $logoPath = public_path('storage/' . $logo);
            } elseif (file_exists(storage_path('app/public/' . $logo))) {
                $logoPath = storage_path('app/public/' . $logo);
            } elseif (file_exists(public_path($logo))) {
                $logoPath = public_path($logo);
            }
        }

        $settings = [
            'title' => 'Rekap Bimbingan Siswa (Konseling)',
            'school_name' => \App\Models\Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_address' => \App\Models\Setting::get('school_address'),
            'logo' => $logoPath,
            'class_name' => $className,
            'range' => $range,
            'teacher_name' => Auth::user()->name
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.consultation_pdf', array_merge($settings, [
            'data' => $data
        ]))->setPaper('a4', 'landscape');

        return $pdf->stream('rekap_bimbingan.pdf');
    }

    private function getExportData(Request $request)
    {
        $query = StudentConsultation::where('teacher_id', Auth::id())
            ->with(['student', 'academicClass']);

        if ($request->academic_class_id) {
            $query->where('class_id', $request->academic_class_id);
        }
        if ($request->category) {
            $query->where('category', $request->category);
        }

        $semesterId = $request->input('semester_id');
        if (!$semesterId && !$request->has('start_date') && !$request->has('end_date')) {
            $activeSemester = $this->getActiveSemester();
            $semesterId = $activeSemester?->id;
        }

        if ($semesterId) {
            $selectedSemester = Semester::find($semesterId);
            if ($selectedSemester) {
                $query->whereBetween('consultation_date', [$selectedSemester->start_date, $selectedSemester->end_date]);
            }
        } else {
            if ($request->start_date) {
                $query->whereDate('consultation_date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('consultation_date', '<=', $request->end_date);
            }
        }

        return $query->latest('consultation_date')->get()->toArray();
    }

    public function getStudents($classId)
    {
        $class = AcademicClass::with('students')->find($classId);
        return response()->json($class ? $class->students : []);
    }
}
