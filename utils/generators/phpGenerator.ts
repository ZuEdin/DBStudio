
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType, toPascalCase, toCamelCase } from './common';

export const generatePhp = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // 1. Composer.json (Basic Metadata)
  files.push({
    name: 'composer.json',
    path: `${root}/composer.json`,
    content: JSON.stringify({
      "name": config.projectName.toLowerCase() + "/api",
      "description": "Auto-generated PHP Backend",
      "type": "project",
      "require": {
        "php": ">=7.4",
        "ext-pdo": "*",
        "ext-json": "*"
      },
      "autoload": {
        "psr-4": {
          "App\\": "./"
        }
      }
    }, null, 2),
    language: 'json'
  });

  // 2. Database Config (PDO Factory)
  let dbConnectionLogic = '';
  let dbProps = '';

  if (config.dbType === DbType.SQLite) {
      const dbFile = config.dbConnection.includes('=') ? config.dbConnection.split('=')[1] : 'database.sqlite';
      dbProps = `private $db_file = __DIR__ . '/../../database/${dbFile}';`; // Assuming database folder is sibling to backend code or adjusted path
      // Adjustment: The database generator puts files in Backend/[Project]/database. 
      // The PHP code runs in Backend/[Project]/index.php.
      // So relative path from config/Database.php (level 2) to database/ (level 1) is ../database
      dbProps = `private $db_file = __DIR__ . '/../database/app.db'; // Adjust path as needed`;
      dbConnectionLogic = `$this->conn = new PDO("sqlite:" . $this->db_file);`;
  } else {
      // Parse Connection String for MySQL/SQLServer
      let host = 'localhost';
      let db_name = 'my_db';
      let username = 'root';
      let password = '';
      let port = '';

      if (config.dbConnection) {
          const parts = config.dbConnection.split(';');
          parts.forEach(p => {
              const [k, v] = p.split('=');
              if(!k || !v) return;
              const key = k.trim().toLowerCase();
              const val = v.trim();
              if (key === 'server' || key === 'data source' || key === 'host') host = val;
              if (key === 'database' || key === 'initial catalog') db_name = val;
              if (key === 'user id' || key === 'uid' || key === 'user') username = val;
              if (key === 'password' || key === 'pwd') password = val;
              if (key === 'port') port = val;
          });
      }

      dbProps = `
    private $host = "${host}";
    private $db_name = "${db_name}";
    private $username = "${username}";
    private $password = "${password}";
    private $port = "${port}";`;

      if (config.dbType === DbType.MySQL) {
          const portStr = port ? `;port=" . $this->port` : '';
          dbConnectionLogic = `$this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name . "${portStr}", $this->username, $this->password);`;
      } else if (config.dbType === DbType.SQL) {
          dbConnectionLogic = `$this->conn = new PDO("sqlsrv:Server=" . $this->host . ";Database=" . $this->db_name, $this->username, $this->password);`;
      } else {
          // NoSQL or fallback
          dbConnectionLogic = `throw new Exception("Database type ${config.dbType} not supported in PHP Generator yet.");`;
      }
  }

  const dbClassContent = `<?php
namespace App\\Config;

use PDO;
use PDOException;

class Database {
    ${dbProps}
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            ${dbConnectionLogic}
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>`;
  files.push({ name: 'Database.php', path: `${root}/config/Database.php`, content: dbClassContent, language: 'php' });

  // 3. Base Model
  const baseModelContent = `<?php
namespace App\\Models;

class BaseModel {
    protected $conn;
    protected $table_name;
    protected $primary_key = 'id';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(\\PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE " . $this->primary_key . " = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(\\PDO::FETCH_ASSOC);
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE " . $this->primary_key . " = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        if($stmt->execute()) return true;
        return false;
    }
}
?>`;
  files.push({ name: 'BaseModel.php', path: `${root}/models/BaseModel.php`, content: baseModelContent, language: 'php' });

  // 4. Models & Controllers per Table
  tables.forEach(table => {
      const modelName = toPascalCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey);
      const pkName = pkField ? pkField.name : 'id';
      
      // -- Model --
      const fieldsList = table.fields.map(f => f.name).filter(n => n !== pkName); // Exclude PK for Insert usually if auto-increment
      const fieldsStr = fieldsList.join(", ");
      const paramsStr = fieldsList.map(f => ":" + f).join(", ");
      const updateStr = fieldsList.map(f => `${f} = :${f}`).join(", ");

      const bindParams = fieldsList.map(f => `$stmt->bindParam(":${f}", $data->${f});`).join("\n        ");

      const modelContent = `<?php
namespace App\\Models;

class ${modelName} extends BaseModel {
    protected $table_name = "${table.name}";
    protected $primary_key = "${pkName}";

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " SET ${fieldsList.map(f => `${f}=:${f}`).join(', ')}";
        $stmt = $this->conn->prepare($query);

        // Sanitize & Bind
        ${bindParams}

        if($stmt->execute()) return true;
        return false;
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " SET ${updateStr} WHERE " . $this->primary_key . " = :id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $id);
        ${bindParams}

        if($stmt->execute()) return true;
        return false;
    }
}
?>`;
      files.push({ name: `${modelName}.php`, path: `${root}/models/${modelName}.php`, content: modelContent, language: 'php' });

      // -- Controller --
      const controllerContent = `<?php
namespace App\\Controllers;

use App\\Models\\${modelName};

class ${modelName}Controller {
    private $model;

    public function __construct($db) {
        $this->model = new ${modelName}($db);
    }

    public function processRequest($method, $id = null) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $result = $this->model->getById($id);
                    echo json_encode($result ?: ["message" => "Not found"]);
                } else {
                    $result = $this->model->getAll();
                    echo json_encode($result);
                }
                break;
            case 'POST':
                $data = json_decode(file_get_contents("php://input"));
                if($this->model->create($data)) {
                    http_response_code(201);
                    echo json_encode(["message" => "Created"]);
                } else {
                    http_response_code(503);
                    echo json_encode(["message" => "Unable to create"]);
                }
                break;
            case 'PUT':
                $data = json_decode(file_get_contents("php://input"));
                if($this->model->update($id, $data)) {
                    echo json_encode(["message" => "Updated"]);
                } else {
                    echo json_encode(["message" => "Unable to update"]);
                }
                break;
            case 'DELETE':
                if($this->model->delete($id)) {
                    echo json_encode(["message" => "Deleted"]);
                } else {
                    echo json_encode(["message" => "Unable to delete"]);
                }
                break;
        }
    }
}
?>`;
      files.push({ name: `${modelName}Controller.php`, path: `${root}/controllers/${modelName}Controller.php`, content: controllerContent, language: 'php' });
  });

  // 5. Main Router (index.php)
  const routerContent = `<?php
use App\\Config\\Database;

// Autoloader (Simple manual implementation if not using Composer directly in dev)
spl_autoload_register(function ($class_name) {
    // Convert App\\Models\\Name to ./models/Name.php
    $file = __DIR__ . '/' . str_replace(['App\\\\', '\\\\'], ['', '/'], $class_name) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Router Logic
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', trim($uri, '/'));

// Assuming URL structure: /api/[table_name]/[id]
// Adjust index based on your local server setup. 
// If serving from root, controller is segment 0. If serving from localhost:8000/api, it's 1.
// We'll look for the first segment that matches a known controller.

$resource = null;
$id = null;

// Determine Resource
if (isset($uriSegments[0]) && $uriSegments[0] === 'api' && isset($uriSegments[1])) {
    $resource = $uriSegments[1];
    $id = isset($uriSegments[2]) ? $uriSegments[2] : null;
} elseif (isset($uriSegments[0])) {
    // Fallback if not /api prefix
    $resource = $uriSegments[0];
    $id = isset($uriSegments[1]) ? $uriSegments[1] : null;
}

if (!$resource) {
    echo json_encode(["message" => "Welcome to ${config.projectName} API"]);
    exit();
}

// Map Resource to Controller
// resource name "users" -> "UsersController"
$controllerName = 'App\\Controllers\\' . ucfirst($resource) . 'Controller';

if (class_exists($controllerName)) {
    $database = new Database();
    $db = $database->getConnection();
    
    $controller = new $controllerName($db);
    $controller->processRequest($_SERVER["REQUEST_METHOD"], $id);
} else {
    http_response_code(404);
    echo json_encode(["message" => "Resource '$resource' not found."]);
}
?>`;

  files.push({ name: 'index.php', path: `${root}/index.php`, content: routerContent, language: 'php' });

  // 6. Helper: .htaccess for Apache
  files.push({
      name: '.htaccess',
      path: `${root}/.htaccess`,
      content: `RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(.*)$ index.php [QSA,L]`,
      language: 'text'
  });

  return files;
};
