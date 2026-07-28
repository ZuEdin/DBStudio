import JSZip from 'jszip';

export function generatePhpBackend(zip: JSZip, schemaSql: string) {
  // PHP / Laravel Backend
  zip.file("composer.json", JSON.stringify({
    name: "dbstudio/selfhost-backend",
    description: "DB Studio Pro Self-Host Backend (Laravel API)",
    type: "project",
    require: {
      "php": "^8.2",
      "laravel/framework": "^11.0"
    }
  }, null, 2));

  zip.file("routes/api.php", `<?php
use Illuminate\\Support\\Facades\\Route;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Http\\Request;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'service' => 'DB Studio Self-Host (Laravel API)', 'version' => '1.0.0']);
});

Route::get('/projects', function () {
    return response()->json(DB::select('SELECT * FROM sys_projects ORDER BY created_at DESC'));
});

Route::get('/projects/{id}', function ($id) {
    $proj = DB::selectOne('SELECT * FROM sys_projects WHERE id = ?', [$id]);
    if (!$proj) return response()->json(['error' => 'Nicht gefunden'], 404);
    $payload = DB::selectOne('SELECT data_json FROM sys_project_payloads WHERE project_id = ?', [$id]);
    $proj->data = $payload ? json_decode($payload->data_json) : null;
    return response()->json($proj);
});

Route::post('/projects', function (Request $request) {
    $id = $request->input('id', 'proj_' . time());
    DB::insert('INSERT INTO sys_projects (id, name, db_type, is_cloud, owner_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name', [
        $id, $request->input('name', 'Neues Projekt'), $request->input('db_type', 'SQLite'), $request->input('is_cloud', 0), 'admin'
    ]);
    if ($request->has('data')) {
        DB::insert('INSERT INTO sys_project_payloads (project_id, data_json) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET data_json=excluded.data_json', [
            $id, json_encode($request->input('data'))
        ]);
    }
    return response()->json(['success' => true, 'id' => $id]);
});

Route::get('/data/{tableName}', function ($tableName, Request $request) {
    $rows = DB::select('SELECT data_json FROM sys_table_data WHERE table_name = ?', [$tableName]);
    return response()->json(array_map(fn($r) => json_decode($r->data_json), $rows));
});
`);

  zip.file("Dockerfile", `FROM php:8.2-cli\nRUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev\nWORKDIR /app\nCOPY . .\nEXPOSE 8000\nCMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]`);
  zip.file("README.md", `# DB Studio Pro - PHP Laravel Self-Host Backend\n\n1. \`composer install\`\n2. \`php artisan serve\``);
  zip.file("start.bat", `@echo off\nphp artisan serve\npause`);
  zip.file("start.sh", `#!/bin/bash\nphp artisan serve`);
}
