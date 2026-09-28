<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AcademicYearController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        return Inertia::render('Admin/AcademicYears/Index', [
            'academicYears' => AcademicYear::with('semesters')->orderBy('name', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->schoolId();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('academic_years', 'name')->where('school_id', $schoolId)],
            'is_active' => 'boolean',
        ]);

        DB::transaction(function () use ($validated) {
            if ($validated['is_active'] ?? false) {
                AcademicYear::where('is_active', true)
                    ->when($this->schoolId(), fn($q) => $q->where('school_id', $this->schoolId()))
                    ->update(['is_active' => false]);
            }

            $academicYear = AcademicYear::create(array_merge($validated, $this->schoolContext()));

            // Parse year from name (e.g. "2025/2026" -> 2025)
            $startYear = (int) substr($academicYear->name, 0, 4);
            $startYear = $startYear > 2000 ? $startYear : date('Y');
            $endYear = $startYear + 1;

            // Default semesters for new academic year
            Semester::create([
                'academic_year_id' => $academicYear->id,
                'name' => 'Ganjil',
                'is_active' => true,
                'start_date' => $startYear . '-07-01',
                'end_date' => $startYear . '-12-31',
            ]);
            Semester::create([
                'academic_year_id' => $academicYear->id,
                'name' => 'Genap',
                'is_active' => false,
                'start_date' => $endYear . '-01-01',
                'end_date' => $endYear . '-06-30',
            ]);
        });

        return redirect()->back()->with('success', 'Tahun ajaran berhasil ditambahkan.');
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $schoolId = $this->schoolId();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', \Illuminate\Validation\Rule::unique('academic_years', 'name')->ignore($academicYear->id)->where('school_id', $schoolId)],
        ]);

        DB::transaction(function () use ($academicYear, $validated) {
            $academicYear->update($validated);

            // Parse year from name (e.g. "2025/2026" -> 2025)
            $startYear = (int) substr($academicYear->name, 0, 4);
            $startYear = $startYear > 2000 ? $startYear : date('Y');
            $endYear = $startYear + 1;

            // Sync Ganjil semester
            $ganjil = Semester::where('academic_year_id', $academicYear->id)
                ->where('name', 'Ganjil')
                ->first();
            if ($ganjil) {
                $ganjil->update([
                    'start_date' => $startYear . '-07-01',
                    'end_date' => $startYear . '-12-31',
                ]);
            } else {
                Semester::create([
                    'academic_year_id' => $academicYear->id,
                    'name' => 'Ganjil',
                    'is_active' => true,
                    'start_date' => $startYear . '-07-01',
                    'end_date' => $startYear . '-12-31',
                ]);
            }

            // Sync Genap semester
            $genap = Semester::where('academic_year_id', $academicYear->id)
                ->where('name', 'Genap')
                ->first();
            if ($genap) {
                $genap->update([
                    'start_date' => $endYear . '-01-01',
                    'end_date' => $endYear . '-06-30',
                ]);
            } else {
                Semester::create([
                    'academic_year_id' => $academicYear->id,
                    'name' => 'Genap',
                    'is_active' => false,
                    'start_date' => $endYear . '-01-01',
                    'end_date' => $endYear . '-06-30',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Tahun ajaran berhasil diperbarui.');
    }

    public function destroy(AcademicYear $academicYear)
    {
        if ($academicYear->is_active) {
            return redirect()->back()->with('error', 'Tahun ajaran aktif tidak dapat dihapus.');
        }

        $academicYear->delete();
        return redirect()->back()->with('success', 'Tahun ajaran berhasil dihapus.');
    }

    public function toggleActive(AcademicYear $academicYear)
    {
        DB::transaction(function () use ($academicYear) {
            AcademicYear::where('is_active', true)->update(['is_active' => false]);
            $academicYear->update(['is_active' => true]);
            \Illuminate\Support\Facades\Cache::forget('active_academic_year_id');
        });

        return redirect()->back()->with('success', 'Tahun ajaran aktif berhasil diubah.');
    }

    public function toggleSemester(Semester $semester)
    {
        DB::transaction(function () use ($semester) {
            // Deactivate ALL semesters across ALL academic years first
            Semester::where('is_active', true)->update(['is_active' => false]);

            $semester->update(['is_active' => true]);
        });

        return redirect()->back()->with('success', 'Semester aktif berhasil diubah.');
    }
}
