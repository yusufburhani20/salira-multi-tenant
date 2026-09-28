<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\AcademicClass;
use App\Models\AcademicYear;
use App\Models\User;
use App\Exports\ClassesExport;
use App\Imports\ClassesImport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class AcademicClassController extends Controller
{
    use HasSchoolScope;
    public function index(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $showArchive = $request->boolean('archive', false);

        $query = AcademicClass::withoutGlobalScope('active_year')->with(['academicYear', 'homeroomTeacher'])->withCount('students');

        if ($activeYear) {
            if ($showArchive) {
                $query->where('academic_year_id', '!=', $activeYear->id);
            } else {
                $query->where('academic_year_id', $activeYear->id);
            }
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $classes = $query->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Classes/Index', [
            'classes'            => $classes,
            'allClasses'         => AcademicClass::with('academicYear')->orderBy('name')->get(),
            'academicYears'      => AcademicYear::orderBy('name', 'desc')->get(),
            'teachers'           => User::role(['Guru', 'Wali Kelas'])->get(['id', 'name', 'nip']),
            'filters'            => $request->only(['search', 'archive']),
            'activeAcademicYear' => $activeYear,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'name'             => 'required|string|max:255',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        // Gunakan tahun ajaran yang dipilih, atau fallback ke yang aktif, atau buat baru
        $academicYearId = $validated['academic_year_id']
            ?? AcademicYear::where('is_active', true)->value('id')
            ?? AcademicYear::firstOrCreate(['name' => date('Y') . '/' . (date('Y') + 1)], ['is_active' => true])->id;

        AcademicClass::create(array_merge([
            'academic_year_id'    => $academicYearId,
            'name'                => $validated['name'],
            'homeroom_teacher_id' => $validated['homeroom_teacher_id'],
        ], $this->schoolContext()));

        return redirect()->back()->with('success', 'Data kelas berhasil ditambahkan.');
    }

    public function update(Request $request, AcademicClass $class)
    {
        $validated = $request->validate([
            'academic_year_id'    => 'nullable|exists:academic_years,id',
            'name'                => 'required|string|max:255',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        $academicYearId = $validated['academic_year_id'] ?? $class->academic_year_id;

        $class->update([
            'academic_year_id'    => $academicYearId,
            'name'                => $validated['name'],
            'homeroom_teacher_id' => $validated['homeroom_teacher_id'],
        ]);

        return redirect()->back()->with('success', 'Data kelas berhasil diperbarui.');
    }

    public function destroy(AcademicClass $class)
    {
        $class->delete();
        return redirect()->back()->with('success', 'Data kelas berhasil dihapus.');
    }

    public function export()
    {
        return Excel::download(new ClassesExport(), 'data-kelas-' . now()->format('Ymd') . '.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|extensions:xlsx,xls,csv|max:5120',
        ]);

        Excel::import(new ClassesImport(), $request->file('file'));

        return redirect()->back()->with('success', 'Import data kelas berhasil.');
    }

    public function template()
    {
        $columns = ['Nama Kelas', 'Tahun Ajaran', 'Wali Kelas'];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            fputcsv($file, ['X IPA 1', '2024/2025', 'Budi Raharjo']);
            fclose($file);
        };

        return response()->streamDownload($callback, 'template-kelas.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function promote(Request $request, AcademicClass $class)
    {
        $validated = $request->validate([
            'action_type'     => 'required|in:promote,graduate',
            'target_class_id' => 'required_if:action_type,promote|nullable|exists:academic_classes,id',
        ]);

        $actionType = $validated['action_type'];
        $students = $class->students()->wherePivot('is_active', true)->get();

        if ($students->isEmpty()) {
            return redirect()->back()->with('error', 'Tidak ada siswa aktif di kelas ini.');
        }

        $studentIds = $students->pluck('id')->toArray();

        \Illuminate\Support\Facades\DB::transaction(function () use ($class, $actionType, $validated, $studentIds) {
            // 1. Nonaktifkan keanggotaan di kelas lama (is_active => false)
            \Illuminate\Support\Facades\DB::table('class_members')
                ->where('class_id', $class->id)
                ->whereIn('student_id', $studentIds)
                ->update(['is_active' => false]);

            if ($actionType === 'promote') {
                $targetClassId = $validated['target_class_id'];
                $targetClass = AcademicClass::findOrFail($targetClassId);
                
                // 2. Hubungkan siswa ke kelas baru (is_active => true)
                $syncData = [];
                foreach ($studentIds as $id) {
                    $syncData[$id] = ['is_active' => true];
                }
                $targetClass->students()->syncWithoutDetaching($syncData);

                // 3. Tandai kelas asal sebagai 'promoted'
                $class->update(['promotion_status' => 'promoted']);
            } else {
                // 2. Jika kelulusan, ubah status siswa di tabel students menjadi 'graduated'
                \App\Models\Student::whereIn('id', $studentIds)->update([
                    'status' => \App\Enums\StudentStatus::graduated
                ]);

                // 3. Tandai kelas asal sebagai 'graduated'
                $class->update(['promotion_status' => 'graduated']);
            }
        });

        $message = $actionType === 'promote'
            ? "Berhasil menaikkan {$students->count()} siswa ke kelas tujuan."
            : "Berhasil meluluskan {$students->count()} siswa.";

        return redirect()->back()->with('success', $message);
    }
}
