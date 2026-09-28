<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PortalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $message;
    protected $data;

    /**
     * Create a new notification instance.
     */
    public function __construct($message, $data = [])
    {
        $this->message = $message;
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if (\App\Models\Setting::get('notif_channel_webpush', '1') === '1') {
            $channels[] = \App\Notifications\Channels\WebPushChannel::class;
        }
        return $channels;
    }

    /**
     * Get the web push representation of the notification.
     */
    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => 'Portal Siswa SALIRA',
            'body' => $this->message,
            'action_url' => '/portal/dashboard',
            'icon' => '/images/icon-192.png',
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => $this->message,
            'data' => $this->data,
        ];
    }
}
