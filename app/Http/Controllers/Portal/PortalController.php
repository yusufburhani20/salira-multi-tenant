<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Bill;
use App\Models\StudentAttendance;
use Illuminate\Support\Facades\DB;
use App\Models\StudentScore;
use App\Models\StudentConsultation;
use App\Models\Setting;
use App\Models\Announcement;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class PortalController extends Controller
{
    public function dashboard()
    {
        $student = Auth::guard('student')->user();
        $studentId = $student->id;
        
        // Define date range: Let's use start of current year basically or last 6 months
        $startDate = Carbon::now()->subMonths(6)->startOfMonth();
        $endDate = Carbon::now()->addDay(); // up to today

        // 1. Count unpaid bills
        $unpaidBills = Bill::where('student_id', $student->id)
            ->where('status', '!=', 'paid')
            ->count();

        // 2. Get attendance stats for the date range (unique per day, worst status wins)
        $attendances = StudentAttendance::where('student_id', $student->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw("
                date,
                CASE MIN(CASE status
                    WHEN 'alpha'     THEN 1
                    WHEN 'terlambat' THEN 2
                    WHEN 'sakit'     THEN 3
                    WHEN 'izin'      THEN 4
                    WHEN 'hadir'     THEN 5
                    ELSE 6 END)
                WHEN 1 THEN 'alpha'
                WHEN 2 THEN 'terlambat'
                WHEN 3 THEN 'sakit'
                WHEN 4 THEN 'izin'
                WHEN 5 THEN 'hadir'
                ELSE 'hadir' END as status
            ")
            ->groupBy('date')
            ->get();

        $statusCounts = $attendances->groupBy(function($a) {
            return (string) ($a->status->value ?? $a->status);
        })->map->count();

        $attendanceStats = [
            'present'    => (int) ($statusCounts['hadir']     ?? $statusCounts['present']    ?? 0),
            'sick'       => (int) ($statusCounts['sakit']     ?? $statusCounts['sick']       ?? 0),
            'permission' => (int) ($statusCounts['izin']      ?? $statusCounts['permission'] ?? 0),
            'absent'     => (int) ($statusCounts['alpha']     ?? $statusCounts['absent']     ?? 0),
            'late'       => (int) ($statusCounts['terlambat'] ?? 0),
        ];

        // 3. Akademik (Scores grouped by Subject)
        $scores = \Illuminate\Support\Facades\DB::table('student_scores')
            ->where('student_scores.student_id', $studentId)
            ->join('daily_assessments', 'student_scores.daily_assessment_id', '=', 'daily_assessments.id')
            ->join('subjects', 'daily_assessments.subject_id', '=', 'subjects.id')
            ->whereBetween('daily_assessments.date', [$startDate, $endDate])
            ->select(
                'student_scores.score',
                'subjects.id as subject_id',
                'subjects.name as subject_name'
            )
            ->get();

        $academics = $scores->groupBy('subject_id')->map(function($group) {
            return [
                'subject' => $group->first()->subject_name,
                'average' => round($group->avg('score'), 1),
                'count'   => $group->count(),
            ];
        })->values();

        // 4. Bimbingan/Konsultasi Terakhir
        $consultations = StudentConsultation::where('student_id', $studentId)
            ->whereBetween('consultation_date', [$startDate, $endDate])
            ->with('homeroomTeacher:id,name')
            ->orderByDesc('consultation_date')
            ->take(5) // Just load 5 latest
            ->get();

        // 5. Today's Attendance (unique daily record, worst status wins)
        $todayAttendance = StudentAttendance::where('student_id', $studentId)
            ->whereDate('date', Carbon::today())
            ->selectRaw("
                date,
                CASE MIN(CASE status
                    WHEN 'alpha'     THEN 1
                    WHEN 'terlambat' THEN 2
                    WHEN 'sakit'     THEN 3
                    WHEN 'izin'      THEN 4
                    WHEN 'hadir'     THEN 5
                    ELSE 6 END)
                WHEN 1 THEN 'alpha'
                WHEN 2 THEN 'terlambat'
                WHEN 3 THEN 'sakit'
                WHEN 4 THEN 'izin'
                WHEN 5 THEN 'hadir'
                ELSE 'hadir' END as status
            ")
            ->groupBy('date')
            ->first();

        $todayStatus = $todayAttendance ? (string) ($todayAttendance->status->value ?? $todayAttendance->status) : null;

        $todayAlphaDetails = [];
        if ($todayStatus === 'alpha') {
            $todayAlphaDetails = StudentAttendance::where('student_id', $studentId)
                ->whereDate('date', Carbon::today())
                ->where('status', 'alpha')
                ->whereNotNull('class_agenda_id')
                ->with('classAgenda:id,subject,lesson_period')
                ->get()
                ->map(fn($att) => [
                    'subject'       => $att->classAgenda->subject ?? 'Mapel Tidak Diketahui',
                    'lesson_period' => $att->classAgenda->lesson_period,
                ]);
        }

        // 6. Announcements
        try {
            $announcements = Announcement::where('is_active', true)
                ->where(function($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', Carbon::now());
                })
                ->whereIn('target', ['all', 'students'])
                ->latest()
                ->get();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Portal dashboard announcements failed: ' . $e->getMessage());
            $announcements = collect();
        }

        return Inertia::render('Portal/Dashboard', [
            'student'            => $student,
            'unpaidBillsCount'   => $unpaidBills,
            'attendanceStats'    => $attendanceStats,
            'academics'          => $academics,
            'consultations'      => $consultations,
            'todayStatus'        => $todayStatus,
            'todayAlphaDetails'  => $todayAlphaDetails,
            'announcements'      => $announcements,
        ]);
    }

    public function bills()
    {
        $student = Auth::guard('student')->user();
        $bills = Bill::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $contact = Setting::get('finance_contact', '');
        // Clean non-numeric characters for WA link safety
        $cleanContact = preg_replace('/[^0-9]/', '', $contact);

        return Inertia::render('Portal/Bills', [
            'bills' => $bills,
            'student' => $student,
            'finance_contact' => $cleanContact
        ]);
    }

    public function reportPdf(Request $request)
    {
        $student = Auth::guard('student')->user();
        $studentId = $student->id;

        $month = $request->month;
        $year = $request->year ?? date('Y');

        if ($month) {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();
            $rangeText = $startDate->translatedFormat('F Y');
        } else {
            // Default: Current semester / 6 months
            $startDate = Carbon::now()->subMonths(6)->startOfMonth();
            $endDate = Carbon::now()->endOfMonth();
            $rangeText = $startDate->translatedFormat('d M Y') . ' - ' . $endDate->translatedFormat('d M Y');
        }

        // 1. Attendance stats (unique per day, worst status wins)
        $attendances = StudentAttendance::where('student_id', $studentId)
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw("
                date,
                CASE MIN(CASE status
                    WHEN 'alpha'     THEN 1
                    WHEN 'terlambat' THEN 2
                    WHEN 'sakit'     THEN 3
                    WHEN 'izin'      THEN 4
                    WHEN 'hadir'     THEN 5
                    ELSE 6 END)
                WHEN 1 THEN 'alpha'
                WHEN 2 THEN 'terlambat'
                WHEN 3 THEN 'sakit'
                WHEN 4 THEN 'izin'
                WHEN 5 THEN 'hadir'
                ELSE 'hadir' END as status
            ")
            ->groupBy('date')
            ->get();

        $statusCounts = $attendances->groupBy(function($a) {
            return (string) ($a->status->value ?? $a->status);
        })->map->count();

        $attendanceSummary = [
            'hadir'     => (int) ($statusCounts['hadir']     ?? $statusCounts['present']    ?? 0),
            'sakit'     => (int) ($statusCounts['sakit']     ?? $statusCounts['sick']       ?? 0),
            'izin'      => (int) ($statusCounts['izin']      ?? $statusCounts['permission'] ?? 0),
            'alpha'     => (int) ($statusCounts['alpha']     ?? $statusCounts['absent']     ?? 0),
            'terlambat' => (int) ($statusCounts['terlambat'] ?? 0),
            'total'     => $attendances->count(),
        ];
        
        $attendanceSummary['percentage'] = $attendanceSummary['total'] > 0
            ? round(($attendanceSummary['hadir'] / $attendanceSummary['total']) * 100)
            : 100;

        // 2. Academics
        $scores = StudentScore::where('student_id', $studentId)
            ->join('daily_assessments', 'student_scores.daily_assessment_id', '=', 'daily_assessments.id')
            ->join('subjects', 'daily_assessments.subject_id', '=', 'subjects.id')
            ->whereBetween('daily_assessments.date', [$startDate, $endDate])
            ->select('student_scores.score', 'subjects.name as subject_name', 'subjects.id as subject_id')
            ->get();

        $academics = $scores->groupBy('subject_id')->map(function($group) {
            return [
                'subject' => $group->first()->subject_name,
                'average' => round($group->avg('score'), 1),
                'count'   => $group->count(),
                'min'     => (float) $group->min('score'),
                'max'     => (float) $group->max('score'),
            ];
        })->values();

        // 3. Consultations
        $consultations = StudentConsultation::where('student_id', $studentId)
            ->whereBetween('consultation_date', [$startDate, $endDate])
            ->with('homeroomTeacher:id,name')
            ->orderByDesc('consultation_date')
            ->get();

        $settings = [
            'school_name'    => Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_address' => Setting::get('school_address', 'Alamat Sekolah Belum Diatur'),
            'school_phone'   => Setting::get('school_phone', '-'),
            'school_email'   => Setting::get('school_email', '-'),
            'report_location'=> Setting::get('report_location', 'Kota'),
            'school_logo'    => Setting::get('school_logo'),
            'title'          => 'LAPORAN PERKEMBANGAN SISWA (DIGITAL)',
            'range'          => $rangeText,
        ];

        $pdf = Pdf::loadView('reports.student_resume_pdf', array_merge($settings, [
            'student' => $student,
            'attendance' => $attendanceSummary,
            'academics' => $academics,
            'consultations' => $consultations,
        ]))->setPaper('a4', 'portrait');

        return $pdf->stream("Rapor_{$student->name}_{$rangeText}.pdf");
    }

    public function notifications(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->paginate(15);

        return Inertia::render('Portal/Notifications', [
            'notifications' => $notifications,
        ]);
    }

    public function attendance(Request $request)
    {
        $student = Auth::guard('student')->user();
        $month = $request->month;
        $year = $request->year ?? date('Y');

        // 1. Base Query for Daily Summary (worst status wins)
        $query = StudentAttendance::where('student_id', $student->id);

        if ($month) {
            $query->whereMonth('date', $month)->whereYear('date', $year);
        } else {
            // Default: Last 6 months
            $query->where('date', '>=', Carbon::now()->subMonths(6)->startOfMonth());
        }

        // Calculation for Overall Stats (based on filtered range)
        $allAttendances = (clone $query)
            ->selectRaw("
                date,
                CASE MIN(CASE status
                    WHEN 'alpha'     THEN 1
                    WHEN 'terlambat' THEN 2
                    WHEN 'sakit'     THEN 3
                    WHEN 'izin'      THEN 4
                    WHEN 'hadir'     THEN 5
                    ELSE 6 END)
                WHEN 1 THEN 'alpha'
                WHEN 2 THEN 'terlambat'
                WHEN 3 THEN 'sakit'
                WHEN 4 THEN 'izin'
                WHEN 5 THEN 'hadir'
                ELSE 'hadir' END as status
            ")
            ->groupBy('date')
            ->get();

        $statusCounts = $allAttendances->groupBy(function($a) {
            return (string) ($a->status->value ?? $a->status);
        })->map->count();

        $attendanceStats = [
            'hadir'     => (int) ($statusCounts['hadir']     ?? 0),
            'sakit'     => (int) ($statusCounts['sakit']     ?? 0),
            'izin'      => (int) ($statusCounts['izin']      ?? 0),
            'alpha'     => (int) ($statusCounts['alpha']     ?? 0),
            'terlambat' => (int) ($statusCounts['terlambat'] ?? 0),
            'total'     => $allAttendances->count(),
        ];

        // 2. Paginated Results
        $attendances = (clone $query)
            ->selectRaw("
                MIN(id) as id,
                date,
                CASE MIN(CASE status
                    WHEN 'alpha'     THEN 1
                    WHEN 'terlambat' THEN 2
                    WHEN 'sakit'     THEN 3
                    WHEN 'izin'      THEN 4
                    WHEN 'hadir'     THEN 5
                    ELSE 6 END)
                WHEN 1 THEN 'alpha'
                WHEN 2 THEN 'terlambat'
                WHEN 3 THEN 'sakit'
                WHEN 4 THEN 'izin'
                WHEN 5 THEN 'hadir'
                ELSE 'hadir' END as status,
                GROUP_CONCAT(DISTINCT notes SEPARATOR ' | ') as notes
            ")
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->paginate(15)
            ->withQueryString();

        // 3. Fetch Full Details (all statuses) for all dates in current page
        $dates = $attendances->getCollection()
            ->pluck('date')
            ->map(fn($d) => $d instanceof \Carbon\Carbon ? $d->toDateString() : (string)$d)
            ->toArray();

        $details = [];
        if (!empty($dates)) {
            $records = StudentAttendance::where('student_id', $student->id)
                ->whereIn('date', $dates)
                ->whereNotNull('class_agenda_id')
                ->with('classAgenda:id,subject,lesson_period')
                ->get();

            foreach ($records as $record) {
                $date = $record->date instanceof \Carbon\Carbon
                    ? $record->date->toDateString()
                    : (string) $record->date;
                if ($record->classAgenda) {
                    $details[$date][] = [
                        'subject'       => $record->classAgenda->subject,
                        'lesson_period' => $record->classAgenda->lesson_period,
                        'status'        => (string) ($record->status->value ?? $record->status),
                    ];
                }
            }
        }

        // Attach details to each paginated row
        $attendances->getCollection()->transform(function ($att) use ($details) {
            $date = $att->date instanceof \Carbon\Carbon
                ? $att->date->toDateString()
                : (string) $att->date;
            $att->details = $details[$date] ?? [];
            return $att;
        });

        return Inertia::render('Portal/Attendance', [
            'attendances'     => $attendances,
            'attendanceStats' => $attendanceStats,
            'filters'         => [
                'month' => $month,
                'year'  => $year,
            ]
        ]);
    }

    public function scores()
    {
        $student = Auth::guard('student')->user();
        
        $scores = StudentScore::with(['assessment.subject'])
            ->where('student_id', $student->id)
            ->get()
            ->groupBy(function($s) {
                return $s->assessment->subject->name ?? 'Lainnya';
            });

        return Inertia::render('Portal/Scores', [
            'scores' => $scores,
        ]);
    }

    public function idCard()
    {
        $student = Auth::guard('student')->user();

        // Generate secure token for QR
        // Structure: NIS:Timestamp:HashedSignature
        $timestamp = time();
        $signature = hash_hmac('sha256', "{$student->nis}:{$timestamp}", config('app.key'));
        $qrToken   = base64_encode("{$student->nis}:{$timestamp}:{$signature}");

        // Ambil kelas aktif beserta tahun ajaran
        $activeClass = $student->academicClasses()
            ->wherePivot('is_active', true)
            ->with('academicYear')
            ->latest('class_members.created_at')
            ->first();

        $settings = [
            'school_name'    => Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_logo'    => Setting::get('school_logo') ? '/storage/' . Setting::get('school_logo') : null,
            'school_address' => Setting::get('school_address', 'Alamat Sekolah'),
        ];

        return Inertia::render('Portal/IdCard', [
            'student'     => $student,
            'qrToken'     => $qrToken,
            'settings'    => $settings,
            'activeClass' => $activeClass ? [
                'name'          => $activeClass->name,
                'academic_year' => $activeClass->academicYear?->name ?? '-',
            ] : null,
        ]);
    }
}
