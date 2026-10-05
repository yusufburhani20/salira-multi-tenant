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
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->nullable()->constrained('schools')->onDelete('cascade');
            $table->string('name'); // e.g. "Presensi GTK", "Shalat Berjamaah", "Kajian Makhsus"
            $table->enum('type', ['gtk', 'shalat', 'pulang', 'kajian'])->default('gtk');
            $table->json('days_of_week')->nullable(); // [1,2,3,4,5,6] (0 = Sunday)
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
