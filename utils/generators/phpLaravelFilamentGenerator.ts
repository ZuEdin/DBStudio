import { Table, Relationship } from '../../types';

export interface PhpGeneratorOptions {
  framework: 'LARAVEL_11' | 'SYMFONY_7' | 'VANILLA_PHP_84';
  useFilamentV3: boolean;
  usePestPhp: boolean;
}

export const generatePhpLaravelProject = (
  tables: Table[],
  relationships: Relationship[],
  options: PhpGeneratorOptions
): Record<string, string> => {
  const files: Record<string, string> = {};

  // composer.json
  files['composer.json'] = JSON.stringify(
    {
      name: 'laravel/enterprise-app',
      type: 'project',
      description: 'Laravel 11 Enterprise REST API with Filament v3',
      require: {
        php: '^8.3|^8.4',
        'laravel/framework': '^11.0',
        'filament/filament': '^3.2',
      },
      'require-dev': {
        'pestphp/pest': '^2.34',
        'phpstan/phpstan': '^1.11',
      },
      autoload: {
        'psr-4': {
          'App\\': 'app/',
          'Database\\Factories\\': 'database/factories/',
          'Database\\Seeders\\': 'database/seeders/',
        },
      },
    },
    null,
    2
  );

  // Models with PHP 8 Attributes
  tables.forEach((t) => {
    const fillable = t.columns.map((c) => `'${c.name}'`).join(', ');

    files[`app/Models/${t.name}.php`] = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class ${t.name} extends Model
{
    use HasFactory;

    protected $table = '${t.name.toLowerCase()}s';

    protected $fillable = [${fillable}];
}`;

    // Controllers
    files[`app/Http/Controllers/${t.name}Controller.php`] = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\${t.name};
use Illuminate\\Http\\Request;
use Illuminate\\Http\\JsonResponse;

class ${t.name}Controller extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(${t.name}::paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            ${t.columns.map((c) => `'${c.name}' => '${c.nullable ? 'nullable' : 'required'}'`).join(',\n            ')}
        ]);

        $record = ${t.name}::create($validated);
        return response()->json($record, 201);
    }
}`;

    // Filament Resource (Admin Panel)
    if (options.useFilamentV3) {
      files[`app/Filament/Resources/${t.name}Resource.php`] = `<?php

namespace App\\Filament\\Resources;

use App\\Models\\${t.name};
use Filament\\Forms;
use Filament\\Tables;
use Filament\\Resources\\Resource;

class ${t.name}Resource extends Resource
{
    protected static ?string $model = ${t.name}::class;
    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Forms\\Form $form): Forms\\Form
    {
        return $form->schema([
            ${t.columns.map((c) => `Forms\\Components\\TextInput::make('${c.name}')->required(!${c.nullable})`).join(',\n            ')}
        ]);
    }
}`;
    }
  });

  // Routes
  files['routes/api.php'] = `<?php

use Illuminate\\Support\\Facades\\Route;

${tables.map((t) => `Route::apiResource('${t.name.toLowerCase()}s', App\\Http\\Controllers\\${t.name}Controller::class);`).join('\n')}`;

  return files;
};
