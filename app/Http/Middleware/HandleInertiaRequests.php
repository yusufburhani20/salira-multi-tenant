<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

use App\Models\Setting;
use App\Models\School;

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
        $schoolName = Setting::get('school_name', 'SALIRA');
        $schoolLogo = Setting::get('school_logo')
            ? asset('storage/' . Setting::get('school_logo'))
            : null;

        // Pass school object for display (e.g. type badge in sidebar)
        $school = null;
        if ($user && isset($user->school_id) && $user->school_id) {
            $school = School::find($user->school_id, ['id', 'name', 'type', 'logo']);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames()->values()->all() : ['Siswa'],
                    'avatar_url' => isset($user->avatar) ? asset('storage/' . $user->avatar) : null,
                ]) : null,
            ],
            'school' => [
                'name'   => $schoolName,
                'logo'   => $schoolLogo,
                'object' => $school,
            ],
            'notifications' => [
                'unreadCount' => $user ? $user->unreadNotifications()->count() : 0,
                'recent' => $user ? $user->notifications()->take(5)->get() : [],
            ],
            'flash' => [
                'success'     => $request->session()->get('success'),
                'error'       => $request->session()->get('error'),
                'ticket_code' => $request->session()->get('ticket_code'),
            ],
            'csrf_token' => csrf_token(),
            'vapid_public_key' => config('services.webpush.vapid_public_key'),
        ];
    }
}
