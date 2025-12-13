
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType } from './common';

export const generatePhp = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // Parse Connection String simply
  let dbName = 'my_database';
  let dbHost = 'localhost';
  let dbUser = 'root';
  let dbPass = '';
  
  if (config.dbConnection.includes(';')) {
      config.dbConnection.split(';').forEach(p => {
          const [k, v] = p.split('=');
          if(!k || !v) return;
          const key = k.trim().toLowerCase();
          if (key === 'database' || key === 'initial catalog') dbName = v.trim();
          if (key === 'server' || key === 'data source' || key === 'host') dbHost = v.trim();
          if (key === 'user' || key === 'uid' || key === 'user id') dbUser = v.trim();
          if (key === 'password' || key === 'pwd') dbPass = v.trim();
      });
  } else if (config.dbConnection.includes('Data Source=')) {
      // SQLite simple format
      dbName = config.dbConnection.split('=')[1];
  }

  // Construct DSN
  let dsnLogic = '';
  if (config.dbType === DbType.SQLite) {
      dsnLogic = `$this->conn = new PDO("sqlite:" . $this->db_name);`;
  } else if (config.dbType === DbType.MySQL) {
      dsnLogic = `$this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);`;
  } else {
      // SQL Server (sqlsrv driver)
      dsnLogic = `$this->conn = new PDO("sqlsrv:Server=" . $this->host . ";Database=" . $this->db_name, $this->username, $this->password);`;
  }

  // 0. CLI_COMMANDS.txt
  const phpExtensions = config.dbType === DbType.SQLite ? 'php_sqlite3, php_pdo_sqlite' 
                      : config.dbType === DbType.MySQL ? 'php_mysqli, php_pdo_mysql' 
                      : 'php_sqlsrv, php_pdo_sqlsrv';

  const cliCommands = `===============================================================
ANLEITUNG: ${config.projectName} (PHP / PDO)
===============================================================

VORAUSSETZUNGEN:
----------------
1. PHP muss installiert sein (php -v).
2. Erforderliche Erweiterungen in php.ini aktivieren:
   ${phpExtensions}
3. Datenbank:
   ${config.dbType === DbType.SQL ? '- SQL Server muss laufen.' : ''}
   ${config.dbType === DbType.MySQL ? '- MySQL Server muss laufen. Datenbank "' + dbName + '" muss manuell angelegt sein (CREATE DATABASE ' + dbName + ').' : ''}
   ${config.dbType === DbType.SQLite ? '- Keine Installation nötig (Datei wird erstellt).' : ''}

BEFEHLE ZUM STARTEN (Terminal / CMD / PowerShell):
--------------------------------------------------

1. In das Projektverzeichnis wechseln:
   cd Backend/${config.projectName}

2. PHP Build-in Server starten:
   php -S localhost:8000

3. Datenbank initialisieren (Einmalig):
   Öffnen Sie im Browser: http://localhost:8000/install.php
   
   Dies erstellt die Tabellen in Ihrer Datenbank.

4. API Testen:
   Rufen Sie z.B. eine Tabelle ab:
   http://localhost:8000/api/${tables[0]?.name.toLowerCase() || 'tablename'}

HINWEIS ZUR PRODUKTION:
-----------------------
Für den produktiven Einsatz sollten Sie einen Webserver wie Apache oder Nginx
verwenden und das Verzeichnis entsprechend konfigurieren.
`;
  files.push({ name: 'CLI_COMMANDS.txt', path: `${root}/CLI_COMMANDS.txt`, content: cliCommands, language: 'text' });

  // 1. Database Config (PDO)
  const dbConfig = `<?php
class Database {
    private $host = "${dbHost}";
    private $db_name = "${dbName}";
    private $username = "${dbUser}";
    private $password = "${dbPass}";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            ${dsnLogic}
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Set charset for non-SQLite
            if ("${config.dbType}" !== "SQLite") {
                 // MySQL/SQLServer command might differ, but 'set names' is common for MySQL
                 // $this->conn->exec("set names utf8");
            }
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>`;
  files.push({ name: 'database.php', path: `${root}/config/database.php`, content: dbConfig, language: 'php' });

  // 1.1 INSTALL / SETUP SCRIPT (Creates tables)
  let sqlScript = `<?php
include_once './config/database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) { die("Database connection failed."); }
    
    echo "<h2>Installing Database (${config.dbType})...</h2>";
`;

  tables.forEach(table => {
      const fieldDefs = table.fields.map(f => {
          const sqlType = resolveType(f, 'sql'); // Use the 'sql' mapping we defined in dataTypes
          let def = `${f.name} ${sqlType}`;
          
          if (f.isPrimaryKey) {
              def += " PRIMARY KEY";
              if (f.type === 'INTEGER') def += " AUTO_INCREMENT";
          } else if (f.allowNull === false) {
              def += " NOT NULL";
          }
          return def;
      }).join(', ');

      // Adjust SQL dialect slightly if needed (e.g. SQLite uses AUTOINCREMENT instead of AUTO_INCREMENT in some cases, but mostly compatible for basic types)
      let createSql = `CREATE TABLE IF NOT EXISTS ${table.name} (${fieldDefs})`;
      if (config.dbType === DbType.SQLite) {
          createSql = createSql.replace('AUTO_INCREMENT', 'AUTOINCREMENT');
      }

      sqlScript += `
    $sql = "${createSql}";
    $conn->exec($sql);
    echo "Table '${table.name}' created or already exists.<br>";
`;
  });

  sqlScript += `
    echo "<h3>Installation Complete.</h3>";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>`;
  files.push({ name: 'install.php', path: `${root}/install.php`, content: sqlScript, language: 'php' });


  // 2. Base Controller / Router logic (index.php)
  const indexPhp = `<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once './config/database.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uriSegments = explode('/', $uri);

// Assuming URL structure: /api/{entity}/{id}
// Adjust index based on your server setup (e.g., if hosted in subdir)
// Quick fix: finding the 'api' segment
$apiIndex = array_search('api', $uriSegments);
$entity = ($apiIndex !== false && isset($uriSegments[$apiIndex + 1])) ? $uriSegments[$apiIndex + 1] : null;
$id = ($apiIndex !== false && isset($uriSegments[$apiIndex + 2])) ? $uriSegments[$apiIndex + 2] : null;

$requestMethod = $_SERVER["REQUEST_METHOD"];

if ($entity) {
    // Basic routing based on table names
    // Capitalize first letter for Controller class convention
    $controllerName = ucfirst($entity) . 'Controller';
    $controllerFile = "./controllers/" . $controllerName . ".php";

    if (file_exists($controllerFile)) {
        include_once $controllerFile;
        $db = new Database();
        $conn = $db->getConnection();
        $controller = new $controllerName($conn);
        $controller->processRequest($requestMethod, $id);
    } else {
        header("HTTP/1.1 404 Not Found");
        echo json_encode(["message" => "Endpoint for '$entity' not found."]);
    }
} else {
    echo json_encode(["message" => "API is running. Run /install.php to set up the DB."]);
}
?>`;
  files.push({ name: 'index.php', path: `${root}/index.php`, content: indexPhp, language: 'php' });

  // 3. Controllers for Tables
  tables.forEach(table => {
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const fieldNames = table.fields.map(f => f.name);
      
      const insertCols = fieldNames.filter(f => f !== pkField.name || !pkField.isAutoIncrement).join(", ");
      const insertParams = fieldNames.filter(f => f !== pkField.name || !pkField.isAutoIncrement).map(f => ":" + f).join(", ");
      const updateSet = fieldNames.filter(f => f !== pkField.name).map(f => `${f} = :${f}`).join(", ");

      const controllerContent = `<?php
class ${table.name}Controller {
    private $conn;
    private $table_name = "${table.name}";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function processRequest($method, $id) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getSingle($id);
                } else {
                    $this->getAll();
                }
                break;
            case 'POST':
                $this->create();
                break;
            case 'PUT':
                $this->update($id);
                break;
            case 'DELETE':
                $this->delete($id);
                break;
            default:
                header("HTTP/1.1 405 Method Not Allowed");
                break;
        }
    }

    private function getAll() {
        $query = "SELECT * FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($result);
    }

    private function getSingle($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE ${pkField.name} = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if($row) {
            echo json_encode($row);
        } else {
            header("HTTP/1.1 404 Not Found");
            echo json_encode(["message" => "Item not found."]);
        }
    }

    private function create() {
        $data = json_decode(file_get_contents("php://input"));
        $query = "INSERT INTO " . $this->table_name . " (${insertCols}) VALUES (${insertParams})"; // Use standard SQL syntax
        
        // MySQL specific alternative syntax was: "INSERT INTO ... SET ..."
        // Using standard INSERT INTO ... VALUES for broader compatibility (SQLite/SQLServer)
        
        $stmt = $this->conn->prepare($query);

        // Bind parameters
        ${fieldNames.filter(f => f !== pkField.name || !pkField.isAutoIncrement).map(f => `
        if(isset($data->${f})) {
            $stmt->bindParam(":${f}", $data->${f});
        } else {
            $val = null; // Handle missing fields
            $stmt->bindParam(":${f}", $val);
        }`).join('')}

        if($stmt->execute()) {
            header("HTTP/1.1 201 Created");
            echo json_encode(["message" => "Created successfully."]);
        } else {
            header("HTTP/1.1 503 Service Unavailable");
            echo json_encode(["message" => "Unable to create item."]);
        }
    }

    private function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        $query = "UPDATE " . $this->table_name . " SET ${updateSet} WHERE ${pkField.name} = :id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":id", $id);
        ${fieldNames.filter(f => f !== pkField.name).map(f => `
        if(isset($data->${f})) $stmt->bindParam(":${f}", $data->${f});`).join('')}

        if($stmt->execute()) {
            echo json_encode(["message" => "Updated successfully."]);
        } else {
            header("HTTP/1.1 503 Service Unavailable");
            echo json_encode(["message" => "Unable to update item."]);
        }
    }

    private function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE ${pkField.name} = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        if($stmt->execute()) {
            echo json_encode(["message" => "Deleted successfully."]);
        } else {
            header("HTTP/1.1 503 Service Unavailable");
            echo json_encode(["message" => "Unable to delete item."]);
        }
    }
}
?>`;
      files.push({ name: `${table.name}Controller.php`, path: `${root}/controllers/${table.name}Controller.php`, content: controllerContent, language: 'php' });
  });

  return files;
};
