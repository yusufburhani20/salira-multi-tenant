<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->onDelete('cascade');
            $table->date('date');
            $table->time('time');
            $table->enum('status', ['hadir', 'tawasul', 'izin', 'dinas', 'sakit', 'libur', 'alpha', 'terlambat'])->default('hadir');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('photo_path')->nullable();
            $table->string('device_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->enum('verification_status', ['valid', 'system_flagged'])->default('valid');
            $table->text('system_notes')->nullable();
            $table->timestamps();
            
            // A user can only log one record per session per day
            $table->unique(['user_id', 'attendance_session_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
