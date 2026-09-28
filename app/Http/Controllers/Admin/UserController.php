<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use App\Enums\UserStatus;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UsersExport;
use App\Imports\UsersImport;

class UserController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        $users = User::with('roles')->latest()->get();
        $roles = Role::pluck('name');
        
        $statuses = [];
        foreach(UserStatus::cases() as $case) {
            $statuses[] = ['value' => $case->value, 'label' => $case->label()];
        }

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'statuses' => $statuses,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'nip' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'telegram_id' => 'nullable|string|max:100',
            'status' => ['required', Rule::enum(UserStatus::class)],
            'roles' => 'nullable|array',
        ]);

        $user = User::create([
            'name'        => $request->name,
            'email'       => $request->email,
            'nip'         => $request->nip,
            'phone'       => $request->phone,
            'telegram_id' => $request->telegram_id,
            'password'    => Hash::make('password'),
            'status'      => $request->status,
            'school_id'   => $this->schoolId(),
        ]);

        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }

        return back()->with('success', 'User created successfully with default password "password".');
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'nip' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'telegram_id' => 'nullable|string|max:100',
            'status' => ['required', Rule::enum(UserStatus::class)],
            'roles' => 'nullable|array',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'nip' => $request->nip,
            'phone' => $request->phone,
            'telegram_id' => $request->telegram_id,
            'status' => $request->status,
        ]);

        if ($request->has('roles')) {
            $user->syncRoles($request->roles);
        }
        
        if ($request->reset_password_default) {
            $user->update(['password' => Hash::make('password')]);
        } elseif ($request->reset_password_email) {
            \Illuminate\Support\Facades\Password::broker()->sendResetLink(
                ['email' => $user->email]
            );
        }

        $msg = 'User updated successfully.';
        if ($request->reset_password_default) $msg .= ' Password reset to default.';
        if ($request->reset_password_email) $msg .= ' Password reset link sent to email.';

        return back()->with('success', $msg);
    }

    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return back()->with('error', 'You cannot delete yourself.');
        }

        $user->delete();
        return back()->with('success', 'User deleted successfully.');
    }

    public function export()
    {
        return Excel::download(new UsersExport(), 'data-user-' . now()->format('Ymd') . '.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|extensions:xlsx,xls,csv|max:5120',
        ]);

        Excel::import(new UsersImport(), $request->file('file'));

        return redirect()->back()->with('success', 'Import data user berhasil.');
    }

    public function template()
    {
        $columns = [
            'Nama Lengkap', 'Email', 'NIP', 'WhatsApp', 'Telegram ID', 'Roles (Pisahkan dengan koma)', 'Status (active/inactive/suspended)'
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            // Example row
            fputcsv($file, ['Ahmad Fauzi', 'ahmad@example.com', '198801012015011001', '08123456789', '@ahmad_fauzi', 'Guru, Wali Kelas', 'active']);
            fclose($file);
        };

        return response()->streamDownload($callback, 'template-user.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}

