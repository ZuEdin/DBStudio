import React, { useState } from 'react';
import { Canvas } from '../../components/Canvas';
import { TableNode, Table, Relationship } from '../../types/index';
import { EditRelationshipModal } from './components/EditRelationshipModal';
import { RelationshipContextMenu } from './components/RelationshipContextMenu';

interface RelationshipsViewProps {
  nodes: TableNode[];
  tables: Table[];
  relationships: Relationship[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onConnect: (t1: string, f1: string, t2: string, f2: string) => void;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onNodeDoubleClick?: (tableId: string) => void;
  showConfirmation?: (title: string, message: string, onConfirm: () => void) => void;
}

export const RelationshipsView: React.FC<RelationshipsViewProps> = ({
  nodes,
  tables,
  relationships,
  onMoveNode,
  onConnect,
  onDeleteRelationship,
  onUpdateRelationship,
  onNodeDoubleClick,
  showConfirmation,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; relId: string } | null>(null);
  const [editingRel, setEditingRel] = useState<Relationship | null>(null);

  const handleRelationshipContextMenu = (event: React.MouseEvent, relId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, relId });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDelete = () => {
    if (contextMenu) {
      const relId = contextMenu.relId;
      const performDelete = () => {
          onDeleteRelationship(relId);
          closeContextMenu();
      };
      
      if (showConfirmation) {
          showConfirmation(
              'Beziehung löschen?', 
              'Möchten Sie diese Verknüpfung zwischen den Tabellen wirklich löschen? Dadurch könnten Abfragen und Formulare beeinträchtigt werden.', 
              performDelete
          );
      } else if (window.confirm('Verknüpfung wirklich löschen?')) {
          performDelete();
      } else {
          closeContextMenu();
      }
    }
  };

  const handleEdit = () => {
    if (contextMenu) {
      const relToEdit = relationships.find(r => r.id === contextMenu.relId);
      if (relToEdit) {
        setEditingRel(relToEdit);
      }
      closeContextMenu();
    }
  };

  const handleSaveRelationship = (updatedRel: Relationship) => {
    onUpdateRelationship(updatedRel);
    setEditingRel(null);
  };

  return (
    <div className="w-full h-full" onClick={closeContextMenu}>
      <Canvas 
        nodes={nodes}
        tables={tables}
        relationships={relationships}
        onMoveNode={onMoveNode}
        onConnect={onConnect}
        onRelationshipContextMenu={handleRelationshipContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        isInteractive={true}
      />
      {contextMenu && (
        <RelationshipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={closeContextMenu}
        />
      )}
      {editingRel && (
        <EditRelationshipModal
          relationship={editingRel}
          tables={tables}
          onSave={handleSaveRelationship}
          onClose={() => setEditingRel(null)}
        />
      )}
    </div>
  );
};