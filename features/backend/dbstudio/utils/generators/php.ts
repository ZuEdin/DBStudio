import JSZip from 'jszip';

export function generatePhpBackend(
  zip: JSZip, 
  schemaSql: string,
  subfolderPath: string = '',
  includeWwwroot: boolean = true
) {
  const cleanSubfolder = subfolderPath.trim().replace(/\/+$/, '');
  const normalizedSubfolder = cleanSubfolder ? (cleanSubfolder.startsWith('/') ? cleanSubfolder : '/' + cleanSubfolder) : '';

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

// Route prefix for subfolder deployment
$prefix = '${normalizedSubfolder}';

Route::group(['prefix' => $prefix], function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok', 
            'service' => 'DB Studio Self-Host (Laravel API)', 
            'version' => '1.0.0',
            'subfolder' => '${normalizedSubfolder}'
        ]);
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
});
`);

  if (includeWwwroot) {
    const wwwrootIndex = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>DB Studio Pro PHP API</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 0.75rem; border: 1px solid #334155; text-align: center; max-width: 480px; }
        h1 { color: #38bdf8; }
        a { color: #38bdf8; }
    </style>
</head>
<body>
    <div class="card">
        <h1>DB Studio Pro PHP API</h1>
        <p>PHP Laravel Self-Host Backend ist aktiv.</p>
        ${normalizedSubfolder ? `<p><strong>Unterordner:</strong> <code>${normalizedSubfolder}</code></p>` : ''}
        <p><a href="${normalizedSubfolder}/api/health">Health Check &rarr;</a></p>
    </div>
</body>
</html>`;
    zip.file("wwwroot/index.html", wwwrootIndex);
    zip.file("public/index.html", wwwrootIndex);

    const htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${normalizedSubfolder ? normalizedSubfolder + '/' : '/'}
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.php [L]
</IfModule>`;
    zip.file("public/.htaccess", htaccess);
    zip.file("wwwroot/.htaccess", htaccess);

    zip.file("wwwroot/web.config", `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="PHP Subfolder Rewrite" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.php" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`);
  }

  zip.file("Dockerfile", `FROM php:8.2-cli\nRUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev\nWORKDIR /app\nCOPY . .\nEXPOSE 8000\nCMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]`);
  zip.file("README.md", `# DB Studio Pro - PHP Laravel Self-Host Backend\n\nUnterstützt Unterordner: \`${normalizedSubfolder || 'root'}\`\n\n1. \`composer install\`\n2. \`php artisan serve\``);
  zip.file("start.bat", `@echo off\nphp artisan serve\npause`);
  zip.file("start.sh", `#!/bin/bash\nphp artisan serve`);
  zip.file("build_webserver.bat", `@echo off\necho [DB Studio Pro] Erstelle Webserver Build fuer PHP Laravel...\ncall composer install --no-dev --optimize-autoloader\necho.\necho [OK] Production Webserver Build abgeschlossen!\npause`);
  zip.file("build_webserver.sh", `#!/bin/bash\necho "[DB Studio Pro] Erstelle Webserver Build für PHP Laravel..."\ncomposer install --no-dev --optimize-autoloader\necho "[OK] Build abgeschlossen!"`);
}

