<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Semester;

/**
 * Provides a consistent, correct way to find the active semester
 * and build semester filter options for KBM & Academic controllers.
 *
 * The "active semester" is ALWAYS the semester that belongs to the
 * currently active academic year, preventing stale semester flags
 * from old years being picked up.
 */
trait ResolvesActiveSemester
{
    /**
     * Returns the semester that:
     * 1. Has is_active = true
     * 2. Belongs to the academic year that has is_active = true
     *
     * Falls back to any is_active semester if no match in active year.
     */
    protected function getActiveSemester(): ?Semester
    {
        return Semester::where('is_active', true)
            ->whereHas('academicYear', fn ($q) => $q->where('is_active', true))
            ->with('academicYear')
            ->first()
            ?? Semester::where('is_active', true)->whereHas('academicYear')->with('academicYear')->first();
    }

    /**
     * Merges active semester date range into $request if no semester/date filter
     * has been provided. Returns the resolved semester ID.
     */
    protected function resolveActiveSemesterIntoRequest(\Illuminate\Http\Request $request): ?int
    {
        if ($request->filled('semester_id')) {
            // User explicitly chose a semester — resolve its dates
            $sem = Semester::find($request->semester_id);
            if ($sem) {
                $request->merge([
                    'start_date' => $sem->start_date,
                    'end_date'   => $sem->end_date,
                ]);
            }
            return $request->semester_id;
        }

        if (!$request->has('start_date') && !$request->has('end_date')) {
            // No filters at all — default to the active semester
            $active = $this->getActiveSemester();
            if ($active) {
                $request->merge([
                    'semester_id' => $active->id,
                    'start_date'  => $active->start_date,
                    'end_date'    => $active->end_date,
                ]);
                return $active->id;
            }
        }

        return null;
    }

    /**
     * Returns all semesters formatted for dropdown options.
     * Active semester is flagged so the frontend can show it first.
     */
    protected function getSemesterOptions(): \Illuminate\Support\Collection
    {
        return Semester::whereHas('academicYear')
            ->with('academicYear')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($sem) => [
                'id'               => $sem->id,
                'name'             => 'TA ' . $sem->academicYear->name . ' - ' . $sem->name,
                'start_date'       => $sem->start_date,
                'end_date'         => $sem->end_date,
                'is_active'        => $sem->is_active,
                'academic_year_id' => $sem->academic_year_id,
            ]);
    }
}
