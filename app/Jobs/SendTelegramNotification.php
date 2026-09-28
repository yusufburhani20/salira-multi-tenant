<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\TelegramService;

class SendTelegramNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $chatId;
    public $message;
    public $parseMode;

    /**
     * Create a new job instance.
     */
    public function __construct($chatId, $message, $parseMode = 'HTML')
    {
        $this->chatId = $chatId;
        $this->message = $message;
        $this->parseMode = $parseMode;
    }

    /**
     * Execute the job.
     */
    public function handle(TelegramService $telegramService): void
    {
        $telegramService->sendMessage($this->chatId, $this->message, $this->parseMode);
    }
}
