<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Event;
use App\Models\User;
use App\Enums\UserStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response|\Illuminate\Http\RedirectResponse
    {
        if (Auth::guard('student')->check()) {
            return redirect()->route('portal.dashboard');
        }

        try {
            $activeEvents = Event::where('is_active', true)
                ->orderBy('date', 'desc')
                ->orderBy('start_time', 'desc')
                ->get(['id', 'name', 'date', 'start_time', 'end_time']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to fetch events for login page: ' . $e->getMessage());
            $activeEvents = collect();
        }

        $users = User::where('status', UserStatus::active)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'nip']);

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'activeEvents' => $activeEvents,
            'users' => $users,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Track last login
        $request->user()->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $user = $request->user();

        // Jika user multi-school dan belum pilih sekolah aktif,
        // arahkan ke halaman pemilihan sekolah terlebih dahulu.
        if ($user->isMultiSchool() && ! session('active_school_id')) {
            return redirect()->route('school.select');
        }

        // Single-school user: set active_school_id ke sekolah utama jika belum ada
        if (! session('active_school_id') && $user->school_id) {
            session(['active_school_id' => $user->school_id]);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        Inertia::clearHistory();

        return redirect('/');
    }
}
