<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\WhatsAppService;
use App\Services\TelegramService;
use App\Models\PushSubscription;
use App\Models\User;
use App\Models\Student;
use Spatie\Permission\Models\Role;
use App\Notifications\GeneralBroadcastPushNotification;
use App\Http\Controllers\Concerns\HasSchoolScope;

class NotificationSettingController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        $settings = [
            // Master Switches
            'notif_channel_email' => Setting::get('notif_channel_email', '1') === '1',
            'notif_channel_telegram' => Setting::get('notif_channel_telegram', '1') === '1',
            'notif_channel_whatsapp' => Setting::get('notif_channel_whatsapp', '1') === '1',
            'notif_channel_webpush' => Setting::get('notif_channel_webpush', '1') === '1',
            
            // Matrix Toggles
            'notif_bill_generated_email' => Setting::get('notif_bill_generated_email', '1') === '1',
            'notif_bill_generated_telegram' => Setting::get('notif_bill_generated_telegram', '1') === '1',
            'notif_bill_generated_whatsapp' => Setting::get('notif_bill_generated_whatsapp', '1') === '1',
            'notif_bill_generated_webpush' => Setting::get('notif_bill_generated_webpush', '1') === '1',
            
            'notif_bill_paid_email' => Setting::get('notif_bill_paid_email', '1') === '1',
            'notif_bill_paid_telegram' => Setting::get('notif_bill_paid_telegram', '1') === '1',
            'notif_bill_paid_whatsapp' => Setting::get('notif_bill_paid_whatsapp', '1') === '1',
            'notif_bill_paid_webpush' => Setting::get('notif_bill_paid_webpush', '1') === '1',
            
            'notif_absence_email' => Setting::get('notif_absence_email', '1') === '1',
            'notif_absence_telegram' => Setting::get('notif_absence_telegram', '1') === '1',
            'notif_absence_whatsapp' => Setting::get('notif_absence_whatsapp', '1') === '1',
            'notif_absence_webpush' => Setting::get('notif_absence_webpush', '1') === '1',
            
            'notif_permission_req_email' => Setting::get('notif_permission_req_email', '1') === '1',
            'notif_permission_req_telegram' => Setting::get('notif_permission_req_telegram', '0') === '1', // Default off for Telegram initially
            'notif_permission_req_whatsapp' => Setting::get('notif_permission_req_whatsapp', '1') === '1',
            'notif_permission_req_webpush' => Setting::get('notif_permission_req_webpush', '1') === '1',
            
            'notif_permission_status_email' => Setting::get('notif_permission_status_email', '1') === '1',
            'notif_permission_status_telegram' => Setting::get('notif_permission_status_telegram', '1') === '1',
            'notif_permission_status_whatsapp' => Setting::get('notif_permission_status_whatsapp', '1') === '1',
            'notif_permission_status_webpush' => Setting::get('notif_permission_status_webpush', '1') === '1',

            'notif_announcement_email' => Setting::get('notif_announcement_email', '1') === '1',
            'notif_announcement_telegram' => Setting::get('notif_announcement_telegram', '1') === '1',
            'notif_announcement_whatsapp' => Setting::get('notif_announcement_whatsapp', '1') === '1',
            'notif_announcement_webpush' => Setting::get('notif_announcement_webpush', '1') === '1',

            'notif_student_report_email' => Setting::get('notif_student_report_email', '1') === '1',
            'notif_student_report_telegram' => Setting::get('notif_student_report_telegram', '1') === '1',
            'notif_student_report_whatsapp' => Setting::get('notif_student_report_whatsapp', '1') === '1',
            'notif_student_report_webpush' => Setting::get('notif_student_report_webpush', '1') === '1',

            // WhatsApp Templates
            'tpl_wa_bill_generated' => Setting::get('tpl_wa_bill_generated', "⚠️ *TAGIHAN BARU SALIRA*\n\nBapak/Ibu wali dari *[NAMA_SISWA]*,\nTagihan *[NAMA_TAGIHAN]* sebesar *[NOMINAL]* telah diterbitkan.\n\nHarap segera melakukan pembayaran melalui tautan web di bawah ini:\n[LINK_INVOICE]\n\nTerima kasih."),
            'tpl_wa_bill_paid' => Setting::get('tpl_wa_bill_paid', "✅ *PEMBAYARAN SPP LUNAS*\n\nTerima kasih Bapak/Ibu wali dari *[NAMA_SISWA]*.\nPembayaran untuk tagihan *[NAMA_TAGIHAN]* sebesar *[NOMINAL]* telah kami terima dan lunas.\n\nAnda dapat melihat kuitansi pembayaran melalui tautan berikut:\n[LINK_INVOICE]\n\nTerima kasih atas partisipasi Anda."),
            'tpl_wa_absence' => Setting::get('tpl_wa_absence', "🚨 *PERINGATAN ABSENSI*\n\nBapak/Ibu wali dari *[NAMA_SISWA]*,\nKami informasikan bahwa hingga pukul *[WAKTU]*, anak Anda belum tercatat melakukan presensi kehadiran di sekolah.\n\nMohon konfirmasinya melalui portal atau hubungi wali kelas.\n[LINK_PORTAL]"),
            'tpl_wa_permission_req' => Setting::get('tpl_wa_permission_req', "📝 *Pengajuan Izin Baru*\n\nHalo *[NAMA_ADMIN]*,\nTerdapat pengajuan *[TIPE_IZIN]* baru dari *[NAMA_PEMOHON]*.\n\nAlasan: _[ALASAN]_\n\nSilakan cek di portal untuk menyetujui atau menolak pengajuan ini.\n[LINK_APPROVAL]"),
            'tpl_wa_permission_status' => Setting::get('tpl_wa_permission_status', "📝 *Status Pengajuan Izin*\n\nHalo *[NAMA_PEMOHON]*,\nPengajuan izin *[TIPE_IZIN]* Anda pada tanggal *[TANGGAL]* telah diperbarui.\n\n*Status:* [STATUS]\n[ALASAN_TOLAK]\n\nSilakan cek portal untuk detail lebih lanjut.\n[LINK_PORTAL]"),
            'tpl_wa_announcement' => Setting::get('tpl_wa_announcement', "📢 *PENGUMUMAN PENTING SALIRA*\n\n*[JUDUL_PENGUMUMAN]*\n\n[KONTEN]\n\n[LINK_LAMPIRAN]"),
            'tpl_wa_student_report' => Setting::get('tpl_wa_student_report', "📊 *LAPORAN PERKEMBANGAN SISWA*\n\nHalo Bapak/Ibu wali dari *[NAMA_SISWA]*,\nWali kelas telah mengirimkan ringkasan perkembangan belajar anak Anda.\n\n*[PESAN_WALI]*\n\nSilakan download dokumen laporan selengkapnya di bawah ini:\n[LINK_PDF]"),

            // Telegram Templates
            'tpl_tg_bill_generated' => Setting::get('tpl_tg_bill_generated', "<b>⚠️ TAGIHAN BARU SALIRA</b>\n\nBapak/Ibu wali dari <b>[NAMA_SISWA]</b>,\nTagihan <b>[NAMA_TAGIHAN]</b> sebesar <b>[NOMINAL]</b> telah diterbitkan.\n\nHarap segera melakukan pembayaran melalui tautan web di bawah ini:\n<a href='[LINK_INVOICE]'>Lihat & Bayar Tagihan</a>\n\nTerima kasih."),
            'tpl_tg_bill_paid' => Setting::get('tpl_tg_bill_paid', "<b>✅ PEMBAYARAN SPP LUNAS</b>\n\nTerima kasih Bapak/Ibu wali dari <b>[NAMA_SISWA]</b>.\nPembayaran untuk tagihan <b>[NAMA_TAGIHAN]</b> sebesar <b>[NOMINAL]</b> telah kami terima dan lunas.\n\nAnda dapat melihat kuitansi pembayaran melalui tautan berikut:\n<a href='[LINK_INVOICE]'>Kuitansi Pembayaran</a>\n\nTerima kasih atas partisipasi Anda."),
            'tpl_tg_absence' => Setting::get('tpl_tg_absence', "<b>🚨 PERINGATAN ABSENSI</b>\n\nBapak/Ibu wali dari <b>[NAMA_SISWA]</b>,\nKami informasikan bahwa hingga pukul <b>[WAKTU]</b>, anak Anda belum tercatat melakukan presensi kehadiran di sekolah.\n\nMohon konfirmasinya melalui portal atau hubungi wali kelas.\n<a href='[LINK_PORTAL]'>Portal Siswa</a>"),
            'tpl_tg_permission_req' => Setting::get('tpl_tg_permission_req', "<b>📝 Pengajuan Izin Baru</b>\n\nHalo <b>[NAMA_ADMIN]</b>,\nTerdapat pengajuan <b>[TIPE_IZIN]</b> baru dari <b>[NAMA_PEMOHON]</b>.\n\nAlasan: <i>[ALASAN]</i>\n\nSilakan cek di portal untuk menyetujui atau menolak pengajuan ini.\n<a href='[LINK_APPROVAL]'>Buka Approval</a>"),
            'tpl_tg_permission_status' => Setting::get('tpl_tg_permission_status', "<b>📝 Status Pengajuan Izin</b>\n\nHalo <b>[NAMA_PEMOHON]</b>,\nPengajuan izin <b>[TIPE_IZIN]</b> Anda pada tanggal <b>[TANGGAL]</b> telah diperbarui.\n\n<b>Status:</b> [STATUS]\n[ALASAN_TOLAK]\n\nSilakan cek dashboard untuk detail lebih lanjut."),
            'tpl_tg_announcement' => Setting::get('tpl_tg_announcement', "<b>📢 PENGUMUMAN PENTING SALIRA</b>\n\n<b>[JUDUL_PENGUMUMAN]</b>\n\n[KONTEN]\n\n[LINK_LAMPIRAN]"),
            'tpl_tg_student_report' => Setting::get('tpl_tg_student_report', "<b>📊 LAPORAN PERKEMBANGAN SISWA</b>\n\nHalo Bapak/Ibu wali dari <b>[NAMA_SISWA]</b>,\nWali kelas telah mengirimkan ringkasan perkembangan belajar anak Anda.\n\n<b>[PESAN_WALI]</b>\n\nSilakan download dokumen laporan selengkapnya di bawah ini:\n<a href='[LINK_PDF]'>Download Laporan</a>"),

            // Attendance Alert Settings
            'attendance_alert_enabled' => Setting::get('attendance_alert_enabled', '0') === '1',
            'attendance_alert_time' => Setting::get('attendance_alert_time', '08:00'),

            // User Attendance Reminder Settings
            'user_attendance_reminder_enabled' => Setting::get('user_attendance_reminder_enabled', '1') === '1',
            'user_attendance_reminder_time_in' => Setting::get('user_attendance_reminder_time_in', '07:30'),
            'user_attendance_reminder_time_out' => Setting::get('user_attendance_reminder_time_out', '15:00'),
        ];

        $userSubscriptionsCount = PushSubscription::where('subscribable_type', User::class)->count();
        $studentSubscriptionsCount = PushSubscription::where('subscribable_type', Student::class)->count();
        $roles = Role::pluck('name');

        // Fetch registered subscribers with devices
        $subscribers = PushSubscription::with('subscribable')
            ->get()
            ->groupBy(function($item) {
                return $item->subscribable_type . '_' . $item->subscribable_id;
            })
            ->map(function($group) {
                $first = $group->first();
                $subscribable = $first->subscribable;
                
                if (!$subscribable) {
                    return null;
                }
                
                $type = $first->subscribable_type === User::class ? 'Pegawai' : 'Siswa';
                $roleOrClass = '';
                
                if ($first->subscribable_type === User::class) {
                    $roleOrClass = method_exists($subscribable, 'getRoleNames') ? implode(', ', $subscribable->getRoleNames()->toArray()) : 'Staf';
                } else {
                    $academicClass = $subscribable->academic_class;
                    $roleOrClass = $academicClass ? 'Kelas ' . $academicClass->name : 'Siswa';
                }
                
                return [
                    'id' => $first->id,
                    'name' => $subscribable->name,
                    'email_or_nisn' => $first->subscribable_type === User::class ? $subscribable->email : $subscribable->nisn,
                    'type' => $type,
                    'role_or_class' => $roleOrClass,
                    'devices_count' => $group->count(),
                    'last_active' => $group->max('updated_at')->diffForHumans(),
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('Admin/Settings/Notifications/Index', [
            'settings' => $settings,
            'bot_username' => env('TELEGRAM_BOT_USERNAME', 'SaliraBot'),
            'user_subscriptions_count' => $userSubscriptionsCount,
            'student_subscriptions_count' => $studentSubscriptionsCount,
            'available_roles' => $roles,
            'subscribers' => $subscribers,
        ]);
    }

    public function updateMatrix(Request $request)
    {
        $keys = [
            'notif_channel_email', 'notif_channel_telegram', 'notif_channel_whatsapp', 'notif_channel_webpush',
            'notif_bill_generated_email', 'notif_bill_generated_telegram', 'notif_bill_generated_whatsapp', 'notif_bill_generated_webpush',
            'notif_bill_paid_email', 'notif_bill_paid_telegram', 'notif_bill_paid_whatsapp', 'notif_bill_paid_webpush',
            'notif_absence_email', 'notif_absence_telegram', 'notif_absence_whatsapp', 'notif_absence_webpush',
            'notif_permission_req_email', 'notif_permission_req_telegram', 'notif_permission_req_whatsapp', 'notif_permission_req_webpush',
            'notif_permission_status_email', 'notif_permission_status_telegram', 'notif_permission_status_whatsapp', 'notif_permission_status_webpush',
            'notif_announcement_email', 'notif_announcement_telegram', 'notif_announcement_whatsapp', 'notif_announcement_webpush',
            'notif_student_report_email', 'notif_student_report_telegram', 'notif_student_report_whatsapp', 'notif_student_report_webpush',
            'attendance_alert_enabled', 'user_attendance_reminder_enabled',
        ];

        foreach ($keys as $key) {
            if ($request->has($key)) {
                Setting::set($key, $request->boolean($key) ? '1' : '0');
            }
        }

        if ($request->has('attendance_alert_time')) {
            Setting::set('attendance_alert_time', $request->attendance_alert_time);
        }

        if ($request->has('user_attendance_reminder_time_in')) {
            Setting::set('user_attendance_reminder_time_in', $request->user_attendance_reminder_time_in);
        }

        if ($request->has('user_attendance_reminder_time_out')) {
            Setting::set('user_attendance_reminder_time_out', $request->user_attendance_reminder_time_out);
        }

        return back()->with('success', 'Pengaturan matriks notifikasi berhasil disimpan.');
    }

    public function updateTemplates(Request $request)
    {
        $keys = [
            'tpl_wa_bill_generated', 'tpl_wa_bill_paid', 'tpl_wa_absence', 'tpl_wa_permission_req', 'tpl_wa_permission_status', 'tpl_wa_announcement', 'tpl_wa_student_report',
            'tpl_tg_bill_generated', 'tpl_tg_bill_paid', 'tpl_tg_absence', 'tpl_tg_permission_req', 'tpl_tg_permission_status', 'tpl_tg_announcement', 'tpl_tg_student_report',
        ];

        foreach ($keys as $key) {
            if ($request->has($key)) {
                Setting::set($key, $request->input($key));
            }
        }

        return back()->with('success', 'Template pesan berhasil disimpan.');
    }

    public function whatsappStatus(WhatsAppService $whatsappService)
    {
        $status = $whatsappService->getStatus();
        return response()->json($status);
    }

    public function restartWhatsapp(WhatsAppService $whatsappService)
    {
        $response = $whatsappService->restart();
        if (isset($response['status']) && $response['status'] === 'success') {
            return back()->with('success', 'WhatsApp Gateway sedang di-restart. Tunggu beberapa saat untuk QR Code baru.');
        }
        return back()->with('error', 'Gagal me-restart WhatsApp Gateway.');
    }

    public function testSend(Request $request)
    {
        $request->validate([
            'channel' => 'required|in:email,telegram,whatsapp',
            'target' => 'required|string',
        ]);

        try {
            if ($request->channel === 'whatsapp') {
                app(WhatsAppService::class)->sendMessage($request->target, "👋 *TEST PENGIRIMAN SALIRA*\n\nJika Anda menerima pesan ini, berarti koneksi WhatsApp Gateway SALIRA telah berfungsi dengan baik.");
            } elseif ($request->channel === 'telegram') {
                app(TelegramService::class)->sendMessage($request->target, "<b>👋 TEST PENGIRIMAN SALIRA</b>\n\nJika Anda menerima pesan ini, berarti integrasi Telegram Bot SALIRA telah berfungsi dengan baik.");
            } elseif ($request->channel === 'email') {
                \Illuminate\Support\Facades\Mail::raw("👋 TEST PENGIRIMAN SALIRA\n\nJika Anda menerima pesan ini, berarti konfigurasi SMTP Email SALIRA telah berfungsi dengan baik.", function ($message) use ($request) {
                    $message->to($request->target)
                            ->subject('Uji Coba Notifikasi SALIRA');
                });
            }

            return back()->with('success', "Pesan uji coba berhasil dikirim ke {$request->target} via {$request->channel}");
        } catch (\Exception $e) {
            return back()->with('error', "Gagal mengirim pesan: " . $e->getMessage());
        }
    }

    /**
     * Broadcast push notification to targeted groups or roles.
     */
    public function broadcast(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:255',
            'action_url' => 'required|string',
            'target' => 'required|string',
        ]);

        $title = $request->input('title');
        $body = $request->input('body');
        $actionUrl = $request->input('action_url');
        $target = $request->input('target');

        $count = 0;

        if ($target === 'all') {
            // Broadcast to all active users and students who have subscriptions
            $users = User::where('status', 'active')
                ->when($this->schoolId(), fn($q) => $q->where('school_id', $this->schoolId()))
                ->whereHas('pushSubscriptions')
                ->get();
            foreach ($users as $user) {
                $user->notify(new GeneralBroadcastPushNotification($title, $body, $actionUrl));
                $count++;
            }

            $students = Student::where('status', 'active')
                ->when($this->schoolId(), fn($q) => $q->where('school_id', $this->schoolId()))
                ->whereHas('pushSubscriptions')
                ->get();
            foreach ($students as $student) {
                $student->notify(new GeneralBroadcastPushNotification($title, $body, $actionUrl));
                $count++;
            }
        } elseif ($target === 'students') {
            // Only active students
            $students = Student::where('status', 'active')
                ->when($this->schoolId(), fn($q) => $q->where('school_id', $this->schoolId()))
                ->whereHas('pushSubscriptions')
                ->get();
            foreach ($students as $student) {
                $student->notify(new GeneralBroadcastPushNotification($title, $body, $actionUrl));
                $count++;
            }
        } elseif ($target === 'users') {
            // All active staff/teachers
            $users = User::where('status', 'active')
                ->when($this->schoolId(), fn($q) => $q->where('school_id', $this->schoolId()))
                ->whereHas('pushSubscriptions')
                ->get();
            foreach ($users as $user) {
                $user->notify(new GeneralBroadcastPushNotification($title, $body, $actionUrl));
                $count++;
            }
        } elseif (str_starts_with($target, 'role:')) {
            // Target users with a specific role
            $roleName = substr($target, 5);

            $users = User::role($roleName)
                ->where('status', 'active')
                ->when($this->schoolId(), fn($q) => $q->where('school_id', $this->schoolId()))
                ->whereHas('pushSubscriptions')
                ->get();

            foreach ($users as $user) {
                $user->notify(new GeneralBroadcastPushNotification($title, $body, $actionUrl));
                $count++;
            }
        }

        return back()->with('success', "Notifikasi broadcast berhasil dikirim ke {$count} perangkat penerima.");
    }
}
