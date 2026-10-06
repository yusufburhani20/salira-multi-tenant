<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'nip' => $this->nip ?? null,
            'address' => $this->address ?? null,
            'gender' => $this->gender ?? 'Laki-laki',
            'status' => $this->status,
            'roles' => $this->roles->pluck('name')->toArray(),
            'contexts' => [
                'wali_kelas' => $this->classTeacherContexts->map(function ($class) {
                    return [
                        'class_id' => $class->id,
                        'class_name' => $class->name,
                        'level' => $class->level,
                    ];
                })->toArray(),
                'kepala_program' => $this->programHeadContexts->map(function ($program) {
                    return [
                        'program_id' => $program->id,
                        'program_name' => $program->name,
                    ];
                })->toArray(),
            ]
        ];
    }
}
