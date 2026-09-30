<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

use App\Models\School;
use App\Models\Setting;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Detect user from either default 'web' guard or 'student' guard
        $user = $request->user() ?: $request->user('student');

        // Resolve school branding per logged-in user's school
        $dbSchoolName = Setting::get('school_name');
        $dbSchoolLogo = Setting::get('school_logo');

        // Resolve sekolah yang sedang aktif di session
        // Prioritas: active_school_id dari session → school_id user
        $activeSchool = null;
        $activeSchoolId = session('active_school_id');

        if ($user && isset($user->school_id)) {
            $resolvedId = $activeSchoolId ?? $user->school_id;
            if ($resolvedId) {
                $activeSchool = School::find($resolvedId, ['id', 'name', 'type', 'logo']);
                if ($activeSchool?->logo) {
                    $activeSchool->logo_url = asset('storage/' . $activeSchool->logo);
                }
            }
        }

        $schoolName = $dbSchoolName ?: ($activeSchool ? $activeSchool->name : 'SALIRA');
        $schoolLogo = $dbSchoolLogo 
            ? asset('storage/' . $dbSchoolLogo) 
            : ($activeSchool && isset($activeSchool->logo_url) ? $activeSchool->logo_url : null);

        // Cek apakah user multi-school (untuk tampilkan/sembunyikan context switcher)
        $isMultiSchool = $user && method_exists($user, 'isMultiSchool')
            ? $user->isMultiSchool()
            : false;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles'       => method_exists($user, 'getRoleNames') ? $user->getRoleNames()->values()->all() : ['Siswa'],
                    'avatar_url'  => isset($user->avatar) ? asset('storage/' . $user->avatar) : null,
                    'is_multi_school' => $isMultiSchool,
                ]) : null,
            ],
            'school' => [
                'name'   => $schoolName,
                'logo'   => $schoolLogo,
                'object' => $activeSchool,  // sekolah aktif (bukan selalu sekolah utama)
            ],
            'activeSchool' => $activeSchool ? [
                'id'   => $activeSchool->id,
                'name' => $activeSchool->name,
                'type' => $activeSchool->type,
            ] : null,
            'notifications' => [
                'unreadCount' => $user ? $user->unreadNotifications()->count() : 0,
                'recent'      => $user ? $user->notifications()->take(5)->get() : [],
            ],
            'flash' => [
                'success'     => $request->session()->get('success'),
                'error'       => $request->session()->get('error'),
                'ticket_code' => $request->session()->get('ticket_code'),
            ],
            'csrf_token'      => csrf_token(),
            'vapid_public_key' => config('services.webpush.vapid_public_key'),
        ];
    }
}
