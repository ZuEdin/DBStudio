import { Table } from '../../../types/index';
import { NextcloudAppConfig } from '../../../types/nextcloud';

export const generateTableService = (
  table: Table,
  config: NextcloudAppConfig
): string => {
  const appPascal = toPascalCase(config.appId || 'dbs_custom_app');
  const tablePascal = toPascalCase(table.name);
  const namespace = `OCA\\${appPascal}\\Service`;
  const dbTableName = `${config.tablePrefix || 'dbs_'}${table.name.toLowerCase()}`;
  const pkCol = (table.fields || []).find(c => c.isPrimaryKey)?.name || 'id';

  return `<?php
declare(strict_types=1);

namespace ${namespace};

use OCP\IDBConnection;
use OCP\DB\QueryBuilder\\IQueryBuilder;

/**
 * Service Layer für Tabelle: ${table.name}
 *
 * Nutzt den Nextcloud OCP QueryBuilder (Doctrine DBAL Abstraction Layer).
 * Vollständig kompatibel mit SQLite, MySQL, MariaDB und PostgreSQL!
 */
class ${tablePascal}Service {

    private IDBConnection $db;
    private string $tableName = '${dbTableName}';

    public function __construct(IDBConnection $db) {
        $this->db = $db;
    }

    public function findAll(int $limit = 100, int $offset = 0, ?string $search = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from($this->tableName)
           ->setMaxResults($limit)
           ->setFirstResult($offset);

        if ($search !== null && $search !== '') {
            $qb->where(
                $qb->expr()->like('CAST(${pkCol} AS CHAR)', $qb->createNamedParameter('%' . $search . '%'))
            );
        }

        $result = $qb->executeQuery();
        $rows = $result->fetchAll();
        $result->closeCursor();

        return $rows;
    }

    public function findById(int|string $id): ?array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from($this->tableName)
           ->where($qb->expr()->eq('${pkCol}', $qb->createNamedParameter($id)))
           ->setMaxResults(1);

        $result = $qb->executeQuery();
        $row = $result->fetch();
        $result->closeCursor();

        return $row !== false ? $row : null;
    }

    public function create(array $data): array {
        $qb = $this->db->getQueryBuilder();
        $qb->insert($this->tableName);

        foreach ($data as $column => $value) {
            if ($value !== null) {
                $qb->setValue($column, $qb->createNamedParameter($value));
            }
        }

        $qb->executeStatement();
        $insertId = $this->db->lastInsertId($this->tableName);

        return $this->findById($insertId > 0 ? $insertId : ($data['${pkCol}'] ?? 1)) ?? $data;
    }

    public function update(int|string $id, array $data): ?array {
        $existing = $this->findById($id);
        if (!$existing) {
            return null;
        }

        $qb = $this->db->getQueryBuilder();
        $qb->update($this->tableName);

        foreach ($data as $column => $value) {
            $qb->set($column, $qb->createNamedParameter($value));
        }

        $qb->where($qb->expr()->eq('${pkCol}', $qb->createNamedParameter($id)));
        $qb->executeStatement();

        return $this->findById($id);
    }

    public function delete(int|string $id): bool {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->tableName)
           ->where($qb->expr()->eq('${pkCol}', $qb->createNamedParameter($id)));

        $affected = $qb->executeStatement();
        return $affected > 0;
    }

    public function batchInsert(array $rows): int {
        if (empty($rows)) return 0;
        $count = 0;
        $this->db->beginTransaction();
        try {
            foreach ($rows as $row) {
                $this->create($row);
                $count++;
            }
            $this->db->commit();
        } catch (\\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
        return $count;
    }
}
`;
};

const toPascalCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};
