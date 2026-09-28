<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\User;

class SettingController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                'school_name'              => Setting::get('school_name', 'SALIRA ACADEMY'),
                'school_address'           => Setting::get('school_address', ''),
                'school_phone'             => Setting::get('school_phone', ''),
                'school_email'             => Setting::get('school_email', ''),
                'report_location'          => Setting::get('report_location', 'Kota'),
                'school_logo'              => Setting::get('school_logo') ? Storage::url(Setting::get('school_logo')) : null,
                'school_favicon'           => Setting::get('school_favicon') ? Storage::url(Setting::get('school_favicon')) : null,
                'github_username'          => Setting::get('github_username', ''),
                'github_token'             => Setting::get('github_token', ''),
            ]
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'school_name'        => 'required|string|max:255',
            'school_address'     => 'nullable|string',
            'school_phone'       => 'nullable|string|max:50',
            'school_email'       => 'nullable|email|max:100',
            'report_location'    => 'nullable|string|max:100',
            'school_logo'        => 'nullable|image|max:2048',
            'school_favicon'     => 'nullable|image|mimes:ico,png,jpg,jpeg,svg|max:1024',
            'github_username'    => 'nullable|string|max:100',
            'github_token'       => 'nullable|string|max:255',
        ]);

        Setting::set('school_name', $request->school_name);
        Setting::set('school_address', $request->school_address);
        Setting::set('school_phone', $request->school_phone);
        Setting::set('school_email', $request->school_email);
        Setting::set('report_location', $request->report_location);
        Setting::set('github_username', $request->github_username);
        Setting::set('github_token', $request->github_token);

        if ($request->hasFile('school_logo')) {
            // Delete old logo
            $oldLogo = Setting::get('school_logo');
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }

            $path = $request->file('school_logo')->store('settings', 'public');
            Setting::set('school_logo', $path);
        }

        if ($request->hasFile('school_favicon')) {
            $oldFavicon = Setting::get('school_favicon');
            if ($oldFavicon) {
                Storage::disk('public')->delete($oldFavicon);
            }

            $path = $request->file('school_favicon')->store('settings', 'public');
            Setting::set('school_favicon', $path);
        }

        return back()->with('success', 'Pengaturan berhasil diperbarui');
    }

    public function systemUpdate()
    {
        $scriptPath = base_path('deploy.sh');
        $logPath = storage_path('logs/deploy.log');

        $ts = now()->format('H:i:s');

        // Mulai log baru
        $initLog = "[{$ts}] Memulai proses pembaruan sistem...\n";
        $initLog .= "[{$ts}] Server path: {$scriptPath}\n";
        $initLog .= "[{$ts}] Log path: {$logPath}\n";

        if (!file_exists($scriptPath)) {
            $initLog .= "[{$ts}] ❌ ERROR: deploy.sh tidak ditemukan!\n";
            file_put_contents($logPath, $initLog);
            return response()->json(['status' => 'error', 'message' => 'Script deploy.sh tidak ditemukan.'], 404);
        }

        // Pastikan script bisa dieksekusi
        @chmod($scriptPath, 0755);

        // Cek apakah fungsi exec tersedia
        $disabledFunctions = explode(',', ini_get('disable_functions'));
        if (in_array('exec', array_map('trim', $disabledFunctions))) {
            $initLog .= "[{$ts}] ❌ ERROR: Fungsi exec() dinonaktifkan di server ini (disable_functions).\n";
            $initLog .= "[{$ts}] Solusi: Hapus 'exec' dari disable_functions di konfigurasi PHP aaPanel.\n";
            file_put_contents($logPath, $initLog);
            return response()->json(['status' => 'error', 'message' => 'exec() tidak tersedia.'], 500);
        }

        $initLog .= "[{$ts}] ✅ Menjalankan deploy.sh di latar belakang...\n";
        file_put_contents($logPath, $initLog);

        // Ambil kredensial dari setting dan bersihkan spasi
        $githubToken = trim(Setting::get('github_token', ''));
        $githubUser  = trim(Setting::get('github_username', ''));

        // Pass GitHub credentials as environment variables to the script
        $envPrefix = '';
        if ($githubToken && $githubUser) {
            $envPrefix = "GITHUB_TOKEN=" . escapeshellarg($githubToken) . " GITHUB_USER=" . escapeshellarg($githubUser) . " ";
        }

        // Jalankan script (output append ke log)
        $cmd = "{$envPrefix}bash " . escapeshellarg($scriptPath) . " >> " . escapeshellarg($logPath) . " 2>&1 &";
        exec($cmd);

        return response()->json(['status' => 'success', 'message' => 'Proses pembaruan sedang berjalan.']);
    }

    public function updateLogs()
    {
        $logPath = storage_path('logs/deploy.log');

        if (!file_exists($logPath)) {
            return response()->json(['logs' => 'Belum ada log pembaruan.']);
        }

        // Read file with pure PHP — no shell_exec (more reliable on all servers)
        $content = file_get_contents($logPath);
        
        // Return only the last ~8000 chars to avoid huge payloads
        if (strlen($content) > 8000) {
            $content = '...[log dipotong]...' . substr($content, -8000);
        }

        if (trim($content) === '') {
            return response()->json(['logs' => 'Belum ada log pembaruan.']);
        }

        return response()->json(['logs' => $content]);
    }

    /**
     * Backup the database schema, content, and public storage media to a ZIP download.
     */
    public function backup()
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = config('database.connections.mysql.database');
        $keyName = 'Tables_in_' . $dbName;
        
        $sql = "-- SALIRA Database Backup\n";
        $sql .= "-- Generated on " . now()->toDateTimeString() . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $tableObj) {
            $table = $tableObj->$keyName;
            
            $sql .= "DROP TABLE IF EXISTS `$table`;\n";
            
            $createTable = DB::select("SHOW CREATE TABLE `$table`")[0];
            $sql .= $createTable->{'Create Table'} . ";\n\n";
            
            $rows = DB::table($table)->get();
            foreach ($rows as $row) {
                $rowArray = (array) $row;
                $keys = array_keys($rowArray);
                $escapedValues = array_map(function ($value) {
                    if (is_null($value)) {
                        return 'NULL';
                    }
                    return "'" . addslashes($value) . "'";
                }, array_values($rowArray));
                
                $sql .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
            }
            $sql .= "\n";
        }
        
        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        // Create Zip Archive
        $zipFilename = 'backup-' . now()->format('Y-m-d-H-i-s') . '.zip';
        $zipPath = tempnam(sys_get_temp_dir(), 'salira-backup');

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            // 1. Add database.sql
            $zip->addFromString('database.sql', $sql);

            // 2. Add public storage files recursively
            $storagePublicPath = storage_path('app/public');
            if (is_dir($storagePublicPath)) {
                $files = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($storagePublicPath),
                    \RecursiveIteratorIterator::LEAVES_ONLY
                );

                foreach ($files as $name => $file) {
                    if (!$file->isDir()) {
                        $filePath = $file->getRealPath();
                        // Structure inside ZIP folder: storage/...
                        $relativePath = 'storage/' . substr($filePath, strlen($storagePublicPath) + 1);
                        $zip->addFile($filePath, $relativePath);
                    }
                }
            }

            $zip->close();
        }
        
        return response()->download($zipPath, $zipFilename)->deleteFileAfterSend(true);
    }

    /**
     * Restore database and media files from an uploaded ZIP backup archive.
     */
    public function restore(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file|extensions:zip|max:51200', // max 50MB
        ]);

        $zipPath = $request->file('backup_file')->getRealPath();
        $zip = new \ZipArchive();

        if ($zip->open($zipPath) === true) {
            // 1. Extract database.sql content
            $sqlContent = $zip->getFromName('database.sql');
            if ($sqlContent === false) {
                $zip->close();
                return back()->with('error', 'File backup tidak valid. database.sql tidak ditemukan di dalam arsip ZIP.');
            }

            try {
                DB::beginTransaction();
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                DB::unprepared($sqlContent);
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                DB::commit();
                
                // 2. Extract public storage media files
                $storagePublicPath = storage_path('app/public');
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $filename = $zip->getNameIndex($i);
                    
                    // Only extract files in the storage/ directory of the ZIP
                    if (str_starts_with($filename, 'storage/')) {
                        $fileData = $zip->getFromIndex($i);
                        $relativePath = substr($filename, 8); // remove 'storage/'
                        
                        $destPath = $storagePublicPath . '/' . $relativePath;
                        $destDir = dirname($destPath);
                        
                        if (!is_dir($destDir)) {
                            mkdir($destDir, 0755, true);
                        }
                        
                        file_put_contents($destPath, $fileData);
                    }
                }

                $zip->close();

                // Logout user as database tables have been overwritten
                auth()->logout();
                
                return redirect()->route('login')->with('success', 'Database dan berkas media berhasil dipulihkan. Silakan login kembali.');
            } catch (\Exception $e) {
                DB::rollBack();
                $zip->close();
                return back()->with('error', 'Gagal memulihkan database dan berkas: ' . $e->getMessage());
            }
        } else {
            return back()->with('error', 'Gagal membuka file backup ZIP.');
        }
    }

    /**
     * Clear all transactional data and reset database to fresh state.
     * Preserves current Super Admin and general settings table.
     */
    public function reset()
    {
        $dbName = config('database.connections.mysql.database');
        $tablesObj = DB::select('SHOW TABLES');
        $keyName = 'Tables_in_' . $dbName;
        
        // System tables that should be kept intact
        $protectedTables = [
            'migrations',
            'settings',
            'roles',
            'permissions',
            'model_has_roles',
            'role_has_permissions',
            'model_has_permissions',
            'users',
        ];

        try {
            DB::beginTransaction();
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            foreach ($tablesObj as $tableObj) {
                $table = $tableObj->$keyName;
                
                if (!in_array($table, $protectedTables)) {
                    DB::table($table)->truncate();
                }
            }

            // Delete all other users except the currently logged-in Super Admin
            $currentUser = auth()->user();
            if ($currentUser) {
                // Delete model_has_roles/model_has_permissions references for other users
                DB::table('model_has_roles')
                    ->where('model_id', '!=', $currentUser->id)
                    ->where('model_type', User::class)
                    ->delete();

                DB::table('model_has_permissions')
                    ->where('model_id', '!=', $currentUser->id)
                    ->where('model_type', User::class)
                    ->delete();

                User::where('id', '!=', $currentUser->id)->delete();
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            DB::commit();

            return back()->with('success', 'Basis data berhasil di-reset. Semua data transaksi telah dikosongkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal mereset basis data: ' . $e->getMessage());
        }
    }
}

