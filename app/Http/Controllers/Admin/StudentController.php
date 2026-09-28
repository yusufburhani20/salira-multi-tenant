<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\Student;
use App\Models\AcademicClass;
use App\Exports\StudentsExport;
use App\Imports\StudentsImport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Enums\Gender;
use App\Enums\StudentStatus;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    use HasSchoolScope;
    public function index(Request $request)
    {
        $query = Student::with('academicClasses')->orderBy('name');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('nisn', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $students = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Students/Index', [
            'students'   => $students,
            'filters'    => $request->only(['search', 'status']),
            'classes'    => AcademicClass::orderBy('name')->get(['id', 'name']),
            'canManage'  => auth()->user()->hasAnyRole(['Super Admin', 'Staff/TU']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nisn'              => 'required|string|unique:students',
            'nis'               => 'nullable|string|unique:students',
            'name'              => 'required|string|max:255',
            'gender'            => 'required|in:L,P',
            'status'            => 'required|in:' . implode(',', array_column(StudentStatus::cases(), 'value')),
            'birth_place'       => 'nullable|string',
            'birth_date'        => 'nullable|date',
            'parent_name'       => 'nullable|string',
            'parent_phone'      => 'nullable|string',
            'parent_email'      => 'nullable|email|max:255',
            'parent_telegram_id' => 'nullable|string|max:100',
            'academic_class_id' => 'nullable|exists:academic_classes,id',
            'photo'             => 'nullable|image|mimes:jpeg,png,jpg,webp|max:1024',
        ]);

        $studentData = \Illuminate\Support\Arr::except($validated, ['academic_class_id', 'photo']);
        
        if ($request->hasFile('photo')) {
            $studentData['photo'] = $this->processAndStorePhoto($request->file('photo'));
        }

        $student = Student::create(array_merge($studentData, [
            'password'  => Hash::make($validated['nisn']),
            'school_id' => $this->schoolId(),
        ]));

        if (!empty($validated['academic_class_id'])) {
            $student->academicClasses()->attach($validated['academic_class_id'], ['is_active' => true]);
        }

        return redirect()->back()->with('success', 'Data siswa berhasil ditambahkan.');
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'nisn'              => 'required|string|unique:students,nisn,' . $student->id,
            'nis'               => 'nullable|string|unique:students,nis,' . $student->id,
            'name'              => 'required|string|max:255',
            'gender'            => 'required|in:L,P',
            'status'            => 'required|in:' . implode(',', array_column(StudentStatus::cases(), 'value')),
            'birth_place'       => 'nullable|string',
            'birth_date'        => 'nullable|date',
            'parent_name'       => 'nullable|string',
            'parent_phone'      => 'nullable|string',
            'parent_email'      => 'nullable|email|max:255',
            'parent_telegram_id' => 'nullable|string|max:100',
            'academic_class_id' => 'nullable|exists:academic_classes,id',
            'photo'             => 'nullable|image|mimes:jpeg,png,jpg,webp|max:1024',
        ]);

        $studentData = \Illuminate\Support\Arr::except($validated, ['academic_class_id', 'photo']);
        
        if ($request->hasFile('photo')) {
            if ($student->photo) {
                Storage::delete('public/' . $student->photo);
            }
            $studentData['photo'] = $this->processAndStorePhoto($request->file('photo'));
        } elseif ($request->boolean('delete_photo')) {
            if ($student->photo) {
                Storage::delete('public/' . $student->photo);
            }
            $studentData['photo'] = null;
        }

        $student->update($studentData);

        if ($request->has('academic_class_id')) {
            if (!empty($validated['academic_class_id'])) {
                $activeClassIds = $student->academicClasses()
                    ->wherePivot('is_active', true)
                    ->pluck('academic_classes.id')
                    ->toArray();

                if (!in_array($validated['academic_class_id'], $activeClassIds)) {
                    if (!empty($activeClassIds)) {
                        \Illuminate\Support\Facades\DB::table('class_members')
                            ->where('student_id', $student->id)
                            ->whereIn('class_id', $activeClassIds)
                            ->update(['is_active' => false]);
                    }
                    $student->academicClasses()->syncWithoutDetaching([
                        $validated['academic_class_id'] => ['is_active' => true]
                    ]);
                }
            } else {
                $activeClassIds = $student->academicClasses()
                    ->wherePivot('is_active', true)
                    ->pluck('academic_classes.id')
                    ->toArray();
                if (!empty($activeClassIds)) {
                    \Illuminate\Support\Facades\DB::table('class_members')
                        ->where('student_id', $student->id)
                        ->whereIn('class_id', $activeClassIds)
                        ->update(['is_active' => false]);
                }
            }
        }

        return redirect()->back()->with('success', 'Data siswa berhasil diperbarui.');
    }

    public function destroy(Student $student)
    {
        if ($student->photo) {
            Storage::delete('public/' . $student->photo);
        }
        $student->delete();
        return redirect()->back()->with('success', 'Data siswa berhasil dihapus.');
    }

    public function export()
    {
        return Excel::download(new StudentsExport($this->schoolId()), 'data-siswa-' . now()->format('Ymd') . '.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|extensions:xlsx,xls,csv|max:5120',
        ]);

        Excel::import(new StudentsImport($this->schoolId()), $request->file('file'));

        return redirect()->back()->with('success', 'Import data siswa berhasil.');
    }

    public function template()
    {
        $columns = [
            'NISN', 'NIS', 'Nama Lengkap', 'Jenis Kelamin (L/P)',
            'Tempat Lahir', 'Tanggal Lahir (YYYY-MM-DD)',
            'Nama Orang Tua', 'No. Telepon Orang Tua',
            'Status', 'Nama Kelas',
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            // Example row
            fputcsv($file, ['1234567890', 'S001', 'Budi Santoso', 'L', 'Jakarta', '2007-05-15', 'Andi Santoso', '08123456789', 'active', 'X IPA 1']);
            fclose($file);
        };

        return response()->streamDownload($callback, 'template-siswa.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function printCards($academic_class_id)
    {
        $academicClass = AcademicClass::findOrFail($academic_class_id);
        
        // Cukup ambil siswa aktif di kelas tersebut
        $students = Student::whereHas('academicClasses', function($q) use ($academic_class_id) {
            $q->where('academic_classes.id', $academic_class_id)
              ->where('class_members.is_active', true);
        })->where('status', 'active')->orderBy('name')->get();

        // Siapkan token QR per siswa (menggunakan signature pendek 8 karakter agar pemindaian lebih cepat)
        $studentsWithTokens = $students->map(function ($student) {
            $timestamp = time();
            $fullSignature = hash_hmac('sha256', "{$student->nis}:{$timestamp}", config('app.key'));
            $signature = substr($fullSignature, 0, 8);
            $qrToken = base64_encode("{$student->nis}:{$timestamp}:{$signature}");
            
            return array_merge($student->toArray(), [
                'qr_token' => $qrToken
            ]);
        });

        $settings = [
            'school_name' => \App\Models\Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_logo' => \App\Models\Setting::get('school_logo') ? '/storage/' . \App\Models\Setting::get('school_logo') : null,
            'school_address' => \App\Models\Setting::get('school_address', 'Alamat Sekolah'),
        ];

        return Inertia::render('Admin/Students/PrintCards', [
            'academicClass' => $academicClass,
            'students' => $studentsWithTokens,
            'settings' => $settings,
        ]);
    }

    public function printSingleCard(Student $student)
    {
        $student->load('academicClasses');

        // Siapkan token QR per siswa (menggunakan signature pendek 8 karakter agar pemindaian lebih cepat)
        $timestamp = time();
        $fullSignature = hash_hmac('sha256', "{$student->nis}:{$timestamp}", config('app.key'));
        $signature = substr($fullSignature, 0, 8);
        $qrToken = base64_encode("{$student->nis}:{$timestamp}:{$signature}");

        $studentData = array_merge($student->toArray(), [
            'qr_token' => $qrToken
        ]);

        $settings = [
            'school_name' => \App\Models\Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_logo' => \App\Models\Setting::get('school_logo') ? '/storage/' . \App\Models\Setting::get('school_logo') : null,
            'school_address' => \App\Models\Setting::get('school_address', 'Alamat Sekolah'),
        ];

        // academicClass could be the student's current class, or a fallback if they don't have one
        $academicClass = $student->academic_class ?: (object)[
            'id' => null,
            'name' => 'Tanpa Kelas',
        ];

        return Inertia::render('Admin/Students/PrintCards', [
            'academicClass' => $academicClass,
            'students' => [$studentData],
            'settings' => $settings,
        ]);
    }

    private function processAndStorePhoto($file)
    {
        $path = is_string($file) ? $file : $file->getRealPath();
        $imageContent = @file_get_contents($path);
        
        if (!$imageContent) {
            return is_string($file) ? null : $file->store('students/photos', 'public');
        }

        $srcImage = @imagecreatefromstring($imageContent);
        if (!$srcImage) {
            return is_string($file) ? null : $file->store('students/photos', 'public');
        }

        $width = imagesx($srcImage);
        $height = imagesy($srcImage);
        
        $targetSize = 300;
        
        $minDim = min($width, $height);
        $cropX = (int)(($width - $minDim) / 2);
        $cropY = (int)(($height - $minDim) / 2);
        
        $dstImage = imagecreatetruecolor($targetSize, $targetSize);
        
        // Setup transparency support for PNG/WebP (if they are converted)
        imagealphablending($dstImage, false);
        imagesavealpha($dstImage, true);
        
        imagecopyresampled(
            $dstImage, $srcImage,
            0, 0, $cropX, $cropY,
            $targetSize, $targetSize, $minDim, $minDim
        );

        $filename = uniqid('student_') . '.webp';
        $tempPath = tempnam(sys_get_temp_dir(), 'student_photo');
        
        $success = false;
        if (function_exists('imagewebp')) {
            $success = imagewebp($dstImage, $tempPath, 75);
        } else {
            $filename = uniqid('student_') . '.jpg';
            $success = imagejpeg($dstImage, $tempPath, 75);
        }
        
        if ($success) {
            $storedPath = 'students/photos/' . $filename;
            Storage::disk('public')->put($storedPath, file_get_contents($tempPath));
            @unlink($tempPath);
        } else {
            if (is_string($file)) {
                $filename = uniqid('student_') . '.' . pathinfo($file, PATHINFO_EXTENSION);
                $storedPath = 'students/photos/' . $filename;
                Storage::disk('public')->put($storedPath, file_get_contents($file));
            } else {
                $storedPath = $file->store('students/photos', 'public');
            }
        }

        imagedestroy($srcImage);
        imagedestroy($dstImage);

        return $storedPath;
    }

    public function importPhotos(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:zip|max:20480', // max 20MB
        ]);

        $zipFile = $request->file('file');
        $zip = new \ZipArchive();

        if ($zip->open($zipFile->getRealPath()) !== true) {
            return redirect()->back()->with('error', 'Gagal membuka file ZIP.');
        }

        // Create temporary directory
        $tempDirName = 'zip_photos_' . uniqid();
        $tempPath = storage_path('app/temp/' . $tempDirName);
        if (!file_exists($tempPath)) {
            mkdir($tempPath, 0777, true);
        }

        $zip->extractTo($tempPath);
        $zip->close();

        $successCount = 0;
        $skippedCount = 0;

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($tempPath, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if ($file->isDir()) {
                continue;
            }

            $filePath = $file->getRealPath();
            $filename = $file->getFilename();

            // Skip hidden/system files or __MACOSX folders
            if (str_starts_with($filename, '.') || str_contains($filePath, '__MACOSX')) {
                continue;
            }

            $studentIdentifier = pathinfo($filename, PATHINFO_FILENAME);

            // Search by NISN or NIS
            $student = Student::where('nisn', $studentIdentifier)
                ->orWhere('nis', $studentIdentifier)
                ->first();

            if ($student) {
                $photoPath = $this->processAndStorePhoto($filePath);
                if ($photoPath) {
                    if ($student->photo) {
                        Storage::delete('public/' . $student->photo);
                    }
                    $student->update(['photo' => $photoPath]);
                    $successCount++;
                } else {
                    $skippedCount++;
                }
            } else {
                $skippedCount++;
            }
        }

        // Cleanup
        $this->deleteDirectory($tempPath);

        return redirect()->back()->with(
            'success', 
            "Upload foto masal selesai! {$successCount} foto siswa berhasil diperbarui. " . 
            ($skippedCount > 0 ? "{$skippedCount} file dilewati karena NISN/NIS tidak cocok." : "")
        );
    }

    private function deleteDirectory($dir)
    {
        if (!file_exists($dir)) {
            return true;
        }

        if (!is_dir($dir)) {
            return unlink($dir);
        }

        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') {
                continue;
            }

            if (!$this->deleteDirectory($dir . '/' . $item)) {
                return false;
            }
        }

        return rmdir($dir);
    }
}


