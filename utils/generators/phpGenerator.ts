
import { Table, Relationship, Query, BackendConfig, VirtualFile, DbType } from '../../types/index';
import { resolveType } from './common';

export const generatePhp = (tables: Table[], relationships: Relationship[], queries: Query[], config: BackendConfig): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const root = `Backend/${config.projectName}`;

  // Database Connection
  const dbConfig = `<?php
class Database {
    private $host = "localhost"; private $db_name = "my_db"; private $username = "root"; private $password = ""; public $conn;
    public function getConnection() {
        $this->conn = null; try { $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password); } catch(PDOException $exception) { echo "Connection error: " . $exception->getMessage(); } return $this->conn;
    }
} ?>`;
  files.push({ name: 'database.php', path: `${root}/config/database.php`, content: dbConfig, language: 'php' });

  // Install Script
  let sqlScript = `<?php include_once './config/database.php'; $db = new Database(); $conn = $db->getConnection();`;
  tables.forEach(table => {
      const fieldDefs = table.fields.map(f => {
          let def = `${f.name} ${resolveType(f, 'sql')}`;
          if (f.isPrimaryKey) def += " PRIMARY KEY AUTO_INCREMENT";
          return def;
      }).join(', ');
      sqlScript += ` $conn->exec("CREATE TABLE IF NOT EXISTS ${table.name} (${fieldDefs})"); echo "${table.name} created.<br>";`;
  });
  files.push({ name: 'install.php', path: `${root}/install.php`, content: sqlScript, language: 'php' });

  // Controllers
  tables.forEach(table => {
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const controllerContent = `<?php
class ${table.name}Controller {
    private $conn; private $table_name = "${table.name}";
    public function __construct($db) { $this->conn = $db; }
    public function processRequest($method, $id) {
        if ($method === 'GET') {
            $query = "SELECT * FROM " . $this->table_name;
            $stmt = $this->conn->prepare($query); $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    }
} ?>`;
      files.push({ name: `${table.name}Controller.php`, path: `${root}/controllers/${table.name}Controller.php`, content: controllerContent, language: 'php' });
  });

  // Router
  const indexPhp = `<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json; charset=UTF-8");
include_once './config/database.php';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); $uriSegments = explode('/', $uri);
if (isset($uriSegments[2])) {
    $controllerName = ucfirst($uriSegments[2]) . 'Controller';
    include_once "./controllers/" . $controllerName . ".php";
    $db = new Database(); $controller = new $controllerName($db->getConnection());
    $controller->processRequest($_SERVER["REQUEST_METHOD"], null);
} ?>`;
  files.push({ name: 'index.php', path: `${root}/index.php`, content: indexPhp, language: 'php' });

  return files;
};
