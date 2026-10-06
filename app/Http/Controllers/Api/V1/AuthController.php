<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Http\Resources\StudentResource;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string', // bisa email, NIS, atau NISN
            'password' => 'required|string',
        ]);

        $identifier = $request->identifier;
        $user = null;
        $isStudent = false;

        // Jika mengandung '@', asumsikan email (Pegawai/Guru)
        if (str_contains($identifier, '@')) {
            $user = User::where('email', $identifier)->first();
        } else {
            // Jika bukan email, asumsikan NISN (Siswa/Wali Murid)
            $user = Student::where('nisn', $identifier)->first();
            $isStudent = true;
        }

        // Validasi login
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        // Cek status aktif
        $status = $user->status->value ?? clone $user->status;
        if (strtolower($status) !== 'active') {
            throw ValidationException::withMessages([
                'identifier' => ['Akun Anda tidak aktif.'],
            ]);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $isStudent ? new StudentResource($user) : new UserResource($user)
        ]);
    }

    public function logout(Request $request)
    {
        // Menghapus token yang sedang digunakan saat request ini
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if ($user instanceof Student) {
            $user->load(['academicClasses']); // Eager load relasi siswa
            return response()->json([
                'data' => new StudentResource($user)
            ]);
        }

        // Untuk User (Guru/Staff)
        $user->load(['roles', 'classTeacherContexts', 'programHeadContexts']);
        
        return response()->json([
            'data' => new UserResource($user)
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'nip' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'gender' => 'nullable|in:Laki-laki,Perempuan',
            'avatar_base64' => 'nullable|string',
        ]);

        if ($request->has('name')) $user->name = $request->name;
        
        // Cek tipe user (Student vs User) untuk field tertentu
        if (!$user instanceof Student) {
            if ($request->has('phone')) $user->phone = $request->phone;
            if ($request->has('nip')) $user->nip = $request->nip;
            if ($request->has('address')) $user->address = $request->address;
            if ($request->has('gender')) $user->gender = $request->gender;
        }

        // Kalau ada update foto avatar
        // (Untuk production sebaiknya decode base64 lalu save file via Storage::put)
        // Disini kita biarkan field ini tidak error jika dikirim, 
        // tapi implementasi penyimpanannya bisa disesuaikan nanti.

        $user->save();

        if ($user instanceof Student) {
            return response()->json(['message' => 'Profil berhasil diupdate', 'data' => new StudentResource($user)]);
        }
        return response()->json(['message' => 'Profil berhasil diupdate', 'data' => new UserResource($user)]);
    }
}
