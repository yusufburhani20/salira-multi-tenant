<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     * Kirim daftar sekolah aktif agar form bisa menampilkan dropdown.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'schools' => School::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'type']),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'nip'           => 'required|string|max:50|unique:'.User::class,
            'phone'         => 'required|string|max:20|unique:'.User::class,
            'telegram_id'   => 'nullable|string|max:100',
            'role'          => 'required|string|in:Guru,Staff/TU',
            'school_id'     => 'required|exists:schools,id',
            'password'      => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'required'  => ':attribute wajib diisi.',
            'unique'    => ':attribute ini sudah terdaftar. Silakan gunakan yang lain.',
            'confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'email'     => 'Format email tidak valid.',
            'exists'    => ':attribute tidak ditemukan di sistem.',
        ], [
            'name'      => 'Nama Lengkap',
            'email'     => 'Email',
            'nip'       => 'NIP/NUPTK',
            'phone'     => 'No. HP',
            'password'  => 'Kata Sandi',
            'school_id' => 'Sekolah',
        ]);

        $user = User::create([
            'name'        => $request->name,
            'email'       => $request->email,
            'nip'         => $request->nip,
            'phone'       => $request->phone,
            'telegram_id' => $request->telegram_id,
            'school_id'   => $request->school_id,
            'status'      => \App\Enums\UserStatus::active,
            'password'    => Hash::make($request->password),
        ]);

        $user->assignRole($request->role);

        event(new Registered($user));

        return redirect()->route('login')->with('status', 'Registrasi berhasil! Silakan login menggunakan akun Anda.');
    }
}
