
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType, toPascalCase, toCamelCase } from './common';

export const generatePhp = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // 1. Composer.json (Basic Metadata)
  // Ensure mongodb driver is requested if NoSQL
  const requires = {
    "php": ">=7.4",
    "ext-json": "*"
  };
  
  if (config.dbType === DbType.NoSQL) {
      (requires as any)["mongodb/mongodb"] = "^1.15";
  } else {
      (requires as any)["ext-pdo"] = "*";
  }

  files.push({
    name: 'composer.json',
    path: `${root}/composer.json`,
    content: JSON.stringify({
      "name": config.projectName.toLowerCase() + "/api",
      "description": "Auto-generated PHP Backend",
      "type": "project",
      "require": requires,
      "autoload": {
        "psr-4": {
          "App\\": "./"
        }
      }
    }, null, 2),
    language: 'json'
  });

  // 2. Database Config
  let dbClassContent = '';

  if (config.dbType === DbType.NoSQL) {
      // MongoDB Implementation
      const uri = config.dbConnection || 'mongodb://localhost:27017';
      // Parse DB name roughly from URI or default
      let dbName = 'my_db';
      const parts = uri.split('/');
      if (parts.length > 3 && parts[3]) dbName = parts[3].split('?')[0];

      dbClassContent = `<?php
namespace App\\Config;

use MongoDB\\Client;

class Database {
    private $uri = "${uri}";
    private $db_name = "${dbName}";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $client = new Client($this->uri);
            $this->conn = $client->selectDatabase($this->db_name);
        } catch(\\Exception $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>`;
  } else {
      // PDO Implementation
      let dbConnectionLogic = '';
      let dbProps = '';

      if (config.dbType === DbType.SQLite) {
          const dbFile = config.dbConnection.includes('=') ? config.dbConnection.split('=')[1] : 'app.db';
          dbProps = `private $db_file = __DIR__ . '/../database/${dbFile}'; // Adjust path as needed`;
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
          }
      }

      dbClassContent = `<?php
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
  }
  
  files.push({ name: 'Database.php', path: `${root}/config/Database.php`, content: dbClassContent, language: 'php' });

  // 3. Base Model (Adapted for NoSQL vs SQL)
  const isNoSql = config.dbType === DbType.NoSQL;
  
  const baseModelContent = isNoSql ? `<?php
namespace App\\Models;

use MongoDB\\BSON\\ObjectId;

class BaseModel {
    protected $db;
    protected $collection_name;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll() {
        $collection = $this->db->selectCollection($this->collection_name);
        $cursor = $collection->find();
        return iterator_to_array($cursor);
    }

    public function getById($id) {
        $collection = $this->db->selectCollection($this->collection_name);
        return $collection->findOne(['_id' => new ObjectId($id)]);
    }

    public function delete($id) {
        $collection = $this->db->selectCollection($this->collection_name);
        $result = $collection->deleteOne(['_id' => new ObjectId($id)]);
        return $result->getDeletedCount() > 0;
    }
}
?>` : `<?php
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
      const tableName = toPascalCase(table.name);
      
      let modelContent = '';
      if (isNoSql) {
          modelContent = `<?php
namespace App\\Models;

class ${modelName} extends BaseModel {
    protected $collection_name = "${tableName}";

    public function create($data) {
        $collection = $this->db->selectCollection($this->collection_name);
        // Cast object to array for MongoDB driver
        $doc = (array) $data;
        $result = $collection->insertOne($doc);
        return $result->getInsertedCount() > 0;
    }

    public function update($id, $data) {
        $collection = $this->db->selectCollection($this->collection_name);
        $result = $collection->updateOne(
            ['_id' => new \\MongoDB\\BSON\\ObjectId($id)],
            ['$set' => (array) $data]
        );
        return $result->getModifiedCount() > 0;
    }
}
?>`;
      } else {
          // SQL Model
          const pkField = table.fields.find(f => f.isPrimaryKey);
          const pkName = pkField ? pkField.name : 'id';
          const fieldsList = table.fields.map(f => f.name).filter(n => n !== pkName);
          const paramsStr = fieldsList.map(f => ":" + f).join(", ");
          const updateStr = fieldsList.map(f => `${f} = :${f}`).join(", ");
          const bindParams = fieldsList.map(f => `$stmt->bindParam(":${f}", $data->${f});`).join("\n        ");

          modelContent = `<?php
namespace App\\Models;

class ${modelName} extends BaseModel {
    protected $table_name = "${tableName}";
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
      }
      
      files.push({ name: `${modelName}.php`, path: `${root}/models/${modelName}.php`, content: modelContent, language: 'php' });

      // Controller (Mostly generic, but good to have generated)
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

// Autoloader
require_once __DIR__ . '/vendor/autoload.php'; // Assuming composer install was run
spl_autoload_register(function ($class_name) {
    $file = __DIR__ . '/' . str_replace(['App\\\\', '\\\\'], ['', '/'], $class_name) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// CORS Config (Allow Credentials and Reflect Origin)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

// Router Logic
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', trim($uri, '/'));

$resource = null;
$id = null;

if (isset($uriSegments[0]) && $uriSegments[0] === 'api' && isset($uriSegments[1])) {
    $resource = $uriSegments[1];
    $id = isset($uriSegments[2]) ? $uriSegments[2] : null;
} elseif (isset($uriSegments[0])) {
    $resource = $uriSegments[0];
    $id = isset($uriSegments[1]) ? $uriSegments[1] : null;
}

if (!$resource) {
    echo json_encode(["message" => "Welcome to ${config.projectName} API"]);
    exit();
}

$controllerName = 'App\\\\Controllers\\\\' . ucfirst($resource) . 'Controller';

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
  
  if (config.authConfig?.useUserLogin) {
      const authControllerContent = `<?php
namespace App\\Controllers;

class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $action = null) {
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"));

        if ($action === 'login') {
            // Dummy authentication logic
            echo json_encode([
                "token" => "dummy-jwt-token-for-" . ($data->username ?? 'user'), 
                "user" => ["username" => $data->username ?? 'user', "role" => "Admin"]
            ]);
        } elseif ($action === 'login-sso') {
            echo json_encode([
                "token" => "dummy-jwt-token-for-sso-" . ($data->provider ?? 'unknown'), 
                "user" => ["username" => "SSO User", "role" => "User"]
            ]);
        } elseif ($action === 'register') {
            // Dummy logic for registering
            http_response_code(201);
            echo json_encode(["message" => "User registered successfully"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Bad request auth action"]);
        }
    }
}
?>`;
      files.push({ name: 'AuthController.php', path: `${root}/controllers/AuthController.php`, content: authControllerContent, language: 'php' });
  }

  // 6. Helper: .htaccess
  files.push({
      name: '.htaccess',
      path: `${root}/.htaccess`,
      content: `RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^(.*)$ index.php [QSA,L]`,
      language: 'text'
  });

  // Docs
  const readmeContent = `# ${config.projectName} (PHP Native)

## Voraussetzungen
1. Installieren Sie **PHP** (Version 7.4 oder höher).
2. Installieren Sie **Composer** (für Autoloading, optional aber empfohlen).
3. Stellen Sie sicher, dass Ihre Datenbank (${config.dbType}) läuft.

## Einrichtung
1. Öffnen Sie \`config/Database.php\` und passen Sie die Verbindungseinstellungen an (Host, User, Password).
2. Führen Sie im Terminal \`composer install\` aus (oder nutzen Sie den eingebauten Fallback-Autoloader im \`index.php\`, falls keine externen Libs genutzt werden).

## Starten
Sie können den eingebauten PHP-Server verwenden. Öffnen Sie ein Terminal in diesem Ordner:

\`\`\`bash
# Server starten
php -S localhost:${config.port}
\`\`\`

Die API ist dann unter \`http://localhost:${config.port}/api\` erreichbar.
`;

  files.push({ name: 'README.md', path: `${root}/README.md`, content: readmeContent, language: 'markdown' });

  return files;
};
