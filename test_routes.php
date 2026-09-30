<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = App\Models\User::where('email', 'adminmts@mail.com')->first();
auth()->login($user);

$routes = collect(Illuminate\Support\Facades\Route::getRoutes())->filter(fn($r) => in_array('GET', $r->methods()) && (str_starts_with($r->uri(), 'admin/') || str_starts_with($r->uri(), 'teacher/')))->pluck('uri')->toArray();

foreach ($routes as $uri) {
    if (str_contains($uri, '{')) continue;
    $req = Illuminate\Http\Request::create($uri, 'GET');
    $res = $kernel->handle($req);
    
    $status = $res->getStatusCode();
    if ($status >= 500) {
        echo "ERROR: $uri (" . $status . ")\n";
    }
}
echo "DONE\n";
