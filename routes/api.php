<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\StudentAttendanceController;
use App\Http\Controllers\Api\V1\DeviceTokenController;
use App\Http\Controllers\Api\V1\LeaveController;
use App\Http\Controllers\Api\V1\AgendaController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\FinalAssessmentController;
use App\Http\Controllers\Api\V1\EveningStudyController;
use App\Http\Controllers\Api\V1\ConsultationController;
use App\Http\Controllers\Api\V1\NotificationController;

use App\Http\Controllers\Api\V1\DashboardController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/device-token', [DeviceTokenController::class, 'store']);

        // Dashboard Stats
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Presensi Diri Sendiri (Pegawai / Siswa)
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::get('/attendance/today', [AttendanceController::class, 'today']);
        Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']); // Legacy
        Route::get('/attendance/sessions', [AttendanceController::class, 'sessions']); // New Multi-Session
        Route::post('/attendance/log', [AttendanceController::class, 'storeLog']); // New Multi-Session Log

        // Manajemen Presensi Murid (Khusus Guru/Pegawai)
        Route::get('/students/attendance', [StudentAttendanceController::class, 'index']);
        Route::post('/students/attendance', [StudentAttendanceController::class, 'store']);

        // Perizinan (Leave Requests)
        Route::get('/leaves/form-data', [LeaveController::class, 'getFormData']);
        Route::get('/leaves', [LeaveController::class, 'index']);
        Route::post('/leaves', [LeaveController::class, 'store']);
        Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);

        // Jurnal Mengajar / Agenda Kelas
        Route::get('/agendas/export/excel', [\App\Http\Controllers\Teacher\ClassAgendaController::class, 'exportExcel']);
        Route::get('/agendas/export/pdf', [\App\Http\Controllers\Teacher\ClassAgendaController::class, 'exportPdf']);
        Route::get('/agendas/form-data', [AgendaController::class, 'getClasses']);
        Route::get('/agendas/booked-periods', [AgendaController::class, 'getBookedPeriods']);
        Route::get('/agendas/{id}/students', [AgendaController::class, 'getStudents']);
        Route::get('/agendas/{id}', [AgendaController::class, 'show']);
        Route::get('/agendas', [AgendaController::class, 'index']);
        Route::post('/agendas', [AgendaController::class, 'store']);
        Route::put('/agendas/{id}', [AgendaController::class, 'update']);
        Route::delete('/agendas/{id}', [AgendaController::class, 'destroy']);

        // Penilaian Harian (Daily Assessments)
        Route::get('/assessments/form-data', [AssessmentController::class, 'getFormData']);
        Route::get('/assessments/students/{classId}', [AssessmentController::class, 'getStudents']);
        Route::get('/assessments', [AssessmentController::class, 'index']);
        Route::post('/assessments', [AssessmentController::class, 'store']);
        Route::put('/assessments/{id}', [AssessmentController::class, 'update']);
        Route::delete('/assessments/{id}', [AssessmentController::class, 'destroy']);

        // Penilaian Akhir / Ujian Semester (ASAS/ASAT)
        Route::get('/final-assessments/form-data', [FinalAssessmentController::class, 'getFormData']);
        Route::get('/final-assessments/students/{classId}', [FinalAssessmentController::class, 'getStudents']);
        Route::get('/final-assessments', [FinalAssessmentController::class, 'index']);
        Route::post('/final-assessments', [FinalAssessmentController::class, 'store']);
        Route::put('/final-assessments/{id}', [FinalAssessmentController::class, 'update']);
        Route::delete('/final-assessments/{id}', [FinalAssessmentController::class, 'destroy']);

        // Belajar Malam (Evening Study)
        Route::get('/evening-studies/form-data', [EveningStudyController::class, 'getFormData']);
        Route::get('/evening-studies/students/{classId}', [EveningStudyController::class, 'getStudents']);
        Route::get('/evening-studies/{id}', [EveningStudyController::class, 'show']);
        Route::get('/evening-studies', [EveningStudyController::class, 'index']);
        Route::post('/evening-studies', [EveningStudyController::class, 'store']);
        Route::put('/evening-studies/{id}', [EveningStudyController::class, 'update']);
        Route::delete('/evening-studies/{id}', [EveningStudyController::class, 'destroy']);

        // Konsultasi / Bimbingan Siswa
        Route::get('/consultations/form-data', [ConsultationController::class, 'getFormData']);
        Route::get('/consultations/students/{classId}', [ConsultationController::class, 'getStudents']);
        Route::get('/consultations', [ConsultationController::class, 'index']);
        Route::post('/consultations', [ConsultationController::class, 'store']);
        Route::put('/consultations/{id}', [ConsultationController::class, 'update']);
        Route::delete('/consultations/{id}', [ConsultationController::class, 'destroy']);

        // Notifikasi
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });
});
