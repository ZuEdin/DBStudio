import { ProjectTemplate, DbType } from '../../../types/index';
import { getPmTaskBoardPages } from '../pages/index';

const dict: Record<string, any> = {
  de: {
    name: 'Projektmanagement & Task-Board',
    desc: 'Statusgetriebene Vorlage mit Enums, rekursiven Subtasks (ParentTaskId), Soft-Deletes, Änderungsverfolgung und Kanban-Board-Konfiguration.',
    badge: 'INTERAKTIV & STATUS',
    ws_core: 'Bausoftware Core Team',
    ws_client: 'Kundenportal & Mobil-Apps'
  },
  en: {
    name: 'Project Management & Task Board',
    desc: 'Status-driven template with enums, recursive subtasks (ParentTaskId), soft deletes, audit timestamps, and Kanban board config.',
    badge: 'INTERACTIVE & STATUS',
    ws_core: 'Construction Suite Core',
    ws_client: 'Client Portal & Mobile Apps'
  }
};

export const getProjectManagementTaskBoard = (lang: string): ProjectTemplate => {
  const t = dict[lang] || dict['de'];

  return {
    id: 'pm_taskboard',
    name: t.name,
    description: t.desc,
    icon: 'Kanban',
    category: 'IT & Software',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'EnterpriseTaskBoard',
        port: 5002,
        frontendPort: 3002,
        dbConnection: 'Server=localhost;Database=EnterpriseTaskBoard;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: true }
      },
      tables: [
        {
          id: 'tbl_workspace',
          name: 'Workspace',
          fields: [
            { id: 'ws_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'ws_name', name: 'Name', type: 'VARCHAR', length: 100 },
            { id: 'ws_slug', name: 'Slug', type: 'VARCHAR', length: 60 },
            { id: 'ws_desc', name: 'Description', type: 'TEXT' },
            { id: 'ws_owner_id', name: 'OwnerUserId', type: 'INTEGER' }
          ],
          data: [
            { Id: 1, Name: t.ws_core, Slug: 'core-suite', Description: 'Entwicklung der Hauptmodule Shell, CRM, Kalkulation und Aufmaß', OwnerUserId: 1 },
            { Id: 2, Name: t.ws_client, Slug: 'mobile-client', Description: 'iOS / Android Apps für Baustellen-Erfassung und Bautagebuch', OwnerUserId: 2 }
          ]
        },
        {
          id: 'tbl_user',
          name: 'User',
          fields: [
            { id: 'u_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'u_name', name: 'Username', type: 'VARCHAR', length: 50 },
            { id: 'u_full', name: 'FullName', type: 'VARCHAR', length: 100 },
            { id: 'u_email', name: 'Email', type: 'VARCHAR', length: 120 },
            { id: 'u_role', name: 'Role', type: 'VARCHAR', length: 30, defaultValue: 'Developer', enumValues: ['Admin', 'ProjectManager', 'Developer', 'Viewer'] },
            { id: 'u_avatar', name: 'AvatarUrl', type: 'VARCHAR', length: 255 },
            { id: 'u_active', name: 'IsActive', type: 'BOOLEAN', defaultValue: 'true' }
          ],
          data: [
            { Id: 1, Username: 'alex.lead', FullName: 'Alexander Bauer', Email: 'alexander.bauer@bau-enterprise.de', Role: 'Admin', AvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', IsActive: true },
            { Id: 2, Username: 'elena.pm', FullName: 'Elena Rostova', Email: 'elena.rostova@bau-enterprise.de', Role: 'ProjectManager', AvatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100', IsActive: true },
            { Id: 3, Username: 'david.dev', FullName: 'David Kovač', Email: 'david.kovac@bau-enterprise.de', Role: 'Developer', AvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', IsActive: true }
          ]
        },
        {
          id: 'tbl_project',
          name: 'Project',
          fields: [
            { id: 'prj_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'prj_ws_id', name: 'WorkspaceId', type: 'INTEGER' },
            { id: 'prj_name', name: 'Name', type: 'VARCHAR', length: 120 },
            { id: 'prj_key', name: 'Key', type: 'VARCHAR', length: 10 },
            { id: 'prj_desc', name: 'Description', type: 'TEXT' },
            { id: 'prj_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Active', enumValues: ['Planning', 'Active', 'OnHold', 'Completed', 'Archived'] },
            { id: 'prj_start', name: 'StartDate', type: 'DATE' },
            { id: 'prj_end', name: 'TargetEndDate', type: 'DATE' },
            { id: 'prj_creator_id', name: 'CreatedById', type: 'INTEGER' }
          ],
          data: [
            { Id: 1, WorkspaceId: 1, Name: 'MFE Event-Bus Migration & Calc V2', Key: 'CALC', Description: 'Implementierung des Micro-Frontend Event-Busses und der GAEB-Positionsschnittstelle', Status: 'Active', StartDate: '2026-02-01', TargetEndDate: '2026-04-30', CreatedById: 1 },
            { Id: 2, WorkspaceId: 2, Name: 'Baustellen Offline Sync Engine', Key: 'SYNC', Description: 'Offline-First SQLite WASM Replikation für Bauleiter ohne Internetanbindung', Status: 'Active', StartDate: '2026-02-15', TargetEndDate: '2026-05-15', CreatedById: 2 }
          ]
        },
        {
          id: 'tbl_task',
          name: 'Task',
          fields: [
            { id: 'tsk_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'tsk_prj_id', name: 'ProjectId', type: 'INTEGER' },
            { id: 'tsk_parent_id', name: 'ParentTaskId', type: 'INTEGER' },
            { id: 'tsk_title', name: 'Title', type: 'VARCHAR', length: 200 },
            { id: 'tsk_desc', name: 'Description', type: 'TEXT' },
            { id: 'tsk_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Backlog', enumValues: ['Backlog', 'InProgress', 'Review', 'Done'] },
            { id: 'tsk_priority', name: 'Priority', type: 'VARCHAR', length: 20, defaultValue: 'Medium', enumValues: ['Low', 'Medium', 'High', 'Urgent'] },
            { id: 'tsk_assignee_id', name: 'AssignedUserId', type: 'INTEGER' },
            { id: 'tsk_hours', name: 'EstimationHours', type: 'DECIMAL', precision: 6, scale: 2, defaultValue: '8.00' },
            { id: 'tsk_due', name: 'DueDate', type: 'DATE' },
            { id: 'tsk_deleted', name: 'IsDeleted', type: 'BOOLEAN', defaultValue: 'false' },
            { id: 'tsk_created_by', name: 'CreatedBy', type: 'VARCHAR', length: 60, defaultValue: 'System' },
            { id: 'tsk_created_at', name: 'CreatedAt', type: 'DATETIME' },
            { id: 'tsk_updated_at', name: 'UpdatedAt', type: 'DATETIME' }
          ],
          data: [
            { Id: 1, ProjectId: 1, ParentTaskId: null, Title: 'Kalkulations-Engine Backend Refactoring', Description: 'EF Core 10 Entities mit SignalR Broadcasting verknüpfen', Status: 'InProgress', Priority: 'Urgent', AssignedUserId: 3, EstimationHours: 24.00, DueDate: '2026-03-10', IsDeleted: false, CreatedBy: 'alex.lead', CreatedAt: '2026-02-10 09:00:00', UpdatedAt: '2026-02-28 14:20:00' },
            { Id: 2, ProjectId: 1, ParentTaskId: 1, Title: 'Subtask: GAEB XML Parser Validierung', Description: 'Prüfung von GAEB 90, 2000 und DA XML 83 Dateien', Status: 'Done', Priority: 'High', AssignedUserId: 3, EstimationHours: 12.00, DueDate: '2026-02-25', IsDeleted: false, CreatedBy: 'alex.lead', CreatedAt: '2026-02-11 11:00:00', UpdatedAt: '2026-02-24 17:00:00' },
            { Id: 3, ProjectId: 1, ParentTaskId: null, Title: 'Kanban & Drag-and-Drop Spalten im UI', Description: 'Interaktive Verschiebung von Status Backlog -> InProgress -> Review -> Done', Status: 'Review', Priority: 'Medium', AssignedUserId: 1, EstimationHours: 16.00, DueDate: '2026-03-05', IsDeleted: false, CreatedBy: 'elena.pm', CreatedAt: '2026-02-12 10:30:00', UpdatedAt: '2026-03-01 11:15:00' },
            { Id: 4, ProjectId: 2, ParentTaskId: null, Title: 'IndexedDB P2P Replikation via WebRTC', Description: 'Sync-Logik für Offline-Baustellen Tablets', Status: 'Backlog', Priority: 'High', AssignedUserId: 2, EstimationHours: 32.00, DueDate: '2026-03-20', IsDeleted: false, CreatedBy: 'elena.pm', CreatedAt: '2026-02-18 14:00:00', UpdatedAt: '2026-02-18 14:00:00' }
          ]
        },
        {
          id: 'tbl_tag',
          name: 'Tag',
          fields: [
            { id: 'tag_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'tag_name', name: 'Name', type: 'VARCHAR', length: 50 },
            { id: 'tag_color', name: 'ColorHex', type: 'VARCHAR', length: 20, defaultValue: '#3B82F6' },
            { id: 'tag_prj_id', name: 'ProjectId', type: 'INTEGER' }
          ],
          data: [
            { Id: 1, Name: 'Backend .NET', ColorHex: '#10B981', ProjectId: 1 },
            { Id: 2, Name: 'UI / UX', ColorHex: '#6366F1', ProjectId: 1 },
            { Id: 3, Name: 'Offline-Sync', ColorHex: '#F59E0B', ProjectId: 2 },
            { Id: 4, Name: 'Kritisch / Blocker', ColorHex: '#EF4444', ProjectId: 1 }
          ]
        },
        {
          id: 'tbl_task_tag',
          name: 'TaskTag',
          fields: [
            { id: 'tt_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'tt_task_id', name: 'TaskId', type: 'INTEGER' },
            { id: 'tt_tag_id', name: 'TagId', type: 'INTEGER' }
          ],
          data: [
            { Id: 1, TaskId: 1, TagId: 1 },
            { Id: 2, TaskId: 1, TagId: 4 },
            { Id: 3, TaskId: 2, TagId: 1 },
            { Id: 4, TaskId: 3, TagId: 2 }
          ]
        },
        {
          id: 'tbl_comment',
          name: 'Comment',
          fields: [
            { id: 'com_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'com_task_id', name: 'TaskId', type: 'INTEGER' },
            { id: 'com_user_id', name: 'UserId', type: 'INTEGER' },
            { id: 'com_text', name: 'Content', type: 'TEXT' },
            { id: 'com_created_at', name: 'CreatedAt', type: 'DATETIME' }
          ],
          data: [
            { Id: 1, TaskId: 1, UserId: 3, Content: 'Entwurf für den SignalR Hub steht, Tests mit 10.000 Positionen sind grün.', CreatedAt: '2026-02-27 15:40:00' },
            { Id: 2, TaskId: 1, UserId: 1, Content: 'Perfekt! Bitte stelle sicher, dass die EFB-Formulare auch live berechnet werden.', CreatedAt: '2026-02-28 09:10:00' }
          ]
        }
      ],
      relationships: [
        { id: 'rel_ws_prj', fromTableId: 'tbl_workspace', fromFieldId: 'ws_id', toTableId: 'tbl_project', toFieldId: 'prj_ws_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_prj_task', fromTableId: 'tbl_project', fromFieldId: 'prj_id', toTableId: 'tbl_task', toFieldId: 'tsk_prj_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_task_subtask', fromTableId: 'tbl_task', fromFieldId: 'tsk_id', toTableId: 'tbl_task', toFieldId: 'tsk_parent_id', type: '1:n', referentialIntegrity: false },
        { id: 'rel_user_task', fromTableId: 'tbl_user', fromFieldId: 'u_id', toTableId: 'tbl_task', toFieldId: 'tsk_assignee_id', type: '1:n', referentialIntegrity: false },
        { id: 'rel_task_comm', fromTableId: 'tbl_task', fromFieldId: 'tsk_id', toTableId: 'tbl_comment', toFieldId: 'com_task_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_user_comm', fromTableId: 'tbl_user', fromFieldId: 'u_id', toTableId: 'tbl_comment', toFieldId: 'com_user_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_task_tt', fromTableId: 'tbl_task', fromFieldId: 'tsk_id', toTableId: 'tbl_task_tag', toFieldId: 'tt_task_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_tag_tt', fromTableId: 'tbl_tag', fromFieldId: 'tag_id', toTableId: 'tbl_task_tag', toFieldId: 'tt_tag_id', type: '1:n', referentialIntegrity: true }
      ],
      queries: [
        {
          id: 'q_active_kanban_tasks',
          type: 'SELECT',
          name: 'Aktive Aufgaben nach Status & Priorität',
          nodes: [
            { id: 'qn_t', tableId: 'tbl_task', x: 50, y: 50 },
            { id: 'qn_u', tableId: 'tbl_user', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc_id', tableId: 'tbl_task', fieldId: 'tsk_id', tableName: 'Task', fieldName: 'Id', sort: '', show: true, criteria: [''] },
            { id: 'qc_title', tableId: 'tbl_task', fieldId: 'tsk_title', tableName: 'Task', fieldName: 'Title', sort: '', show: true, criteria: [''] },
            { id: 'qc_st', tableId: 'tbl_task', fieldId: 'tsk_status', tableName: 'Task', fieldName: 'Status', sort: 'ASC', show: true, criteria: [''] },
            { id: 'qc_prio', tableId: 'tbl_task', fieldId: 'tsk_priority', tableName: 'Task', fieldName: 'Priority', sort: 'DESC', show: true, criteria: [''] },
            { id: 'qc_user', tableId: 'tbl_user', fieldId: 'u_full', tableName: 'User', fieldName: 'FullName', sort: '', show: true, criteria: [''] }
          ]
        },
        {
          id: 'q_subtask_hierarchy',
          type: 'SELECT',
          name: 'Hierarchische Unteraufgaben (Subtasks)',
          nodes: [
            { id: 'qn_t_parent', tableId: 'tbl_task', x: 50, y: 50 },
            { id: 'qn_t_child', tableId: 'tbl_task', x: 320, y: 50 }
          ],
          columns: [
            { id: 'qc_ptit', tableId: 'tbl_task', fieldId: 'tsk_title', tableName: 'Task', fieldName: 'Title', sort: 'ASC', show: true, criteria: [''], alias: 'Hauptaufgabe' },
            { id: 'qc_ctit', tableId: 'tbl_task', fieldId: 'tsk_title', tableName: 'Task', fieldName: 'Title', sort: '', show: true, criteria: [''], alias: 'Unteraufgabe' },
            { id: 'qc_cst', tableId: 'tbl_task', fieldId: 'tsk_status', tableName: 'Task', fieldName: 'Status', sort: '', show: true, criteria: [''] }
          ]
        }
      ],
      forms: [
        {
          id: 'form_task_card',
          name: 'Task Card & Details',
          sourceType: 'table',
          sourceId: 'tbl_task',
          fields: [],
          layout: {
            id: 'root_task',
            type: 'container',
            className: 'p-4 space-y-4 bg-slate-900/60 rounded-xl border border-slate-700',
            children: [
              { id: 'lbl_t_head', type: 'label', label: 'Aufgabendetails & Status-Workflow', className: 'text-base font-bold text-indigo-400' },
              { id: 'f_t_title', type: 'field', fieldId: 'tsk_title', label: 'Aufgaben-Titel', widgetType: 'text' },
              {
                id: 'cnt_t_status',
                type: 'container',
                className: 'grid grid-cols-3 gap-3',
                children: [
                  { id: 'f_t_stat', type: 'field', fieldId: 'tsk_status', label: 'Status (Kanban Spalte)', widgetType: 'select' },
                  { id: 'f_t_prio', type: 'field', fieldId: 'tsk_priority', label: 'Priorität', widgetType: 'select' },
                  { id: 'f_t_user', type: 'field', fieldId: 'tsk_assignee_id', label: 'Zuständiger Entwickler', widgetType: 'select', lookup: { tableId: 'tbl_user', valueFieldId: 'u_id', labelFields: ['u_full', 'u_role'] } }
                ]
              },
              { id: 'f_t_desc', type: 'field', fieldId: 'tsk_desc', label: 'Beschreibung & Akzeptanzkriterien', widgetType: 'textarea' },
              {
                id: 'subform_comm',
                type: 'subform',
                label: 'Kommentare & Aktivitäts-Verlauf',
                subform: {
                  formId: 'form_comment_sub',
                  masterLinkFieldId: 'tsk_id',
                  childLinkFieldId: 'com_task_id',
                  canAdd: true,
                  canEdit: false,
                  canDelete: true
                }
              }
            ]
          }
        },
        {
          id: 'form_comment_sub',
          name: 'Comment Subform',
          sourceType: 'table',
          sourceId: 'tbl_comment',
          fields: [],
          layout: {
            id: 'sub_comm_root',
            type: 'container',
            className: 'p-2 bg-slate-800/80 rounded-lg space-y-2',
            children: [
              { id: 'f_com_u', type: 'field', fieldId: 'com_user_id', label: 'Autor', widgetType: 'select', lookup: { tableId: 'tbl_user', valueFieldId: 'u_id', labelFields: ['u_full'] } },
              { id: 'f_com_txt', type: 'field', fieldId: 'com_text', label: 'Nachricht', widgetType: 'textarea' }
            ]
          }
        }
      ],
      reports: [
        {
          id: 'rep_task_workload',
          name: 'Entwickler-Workload & Offene Aufgaben',
          sourceType: 'table',
          sourceId: 'tbl_task',
          groupingFieldId: 'tsk_assignee_id',
          summaries: [{ fieldId: 'tsk_id', fieldName: 'Id', calculation: 'COUNT' }, { fieldId: 'tsk_hours', fieldName: 'EstimationHours', calculation: 'SUM' }],
          columns: [
            { fieldId: 'tsk_title', label: 'Aufgabe', visible: true, order: 0 },
            { fieldId: 'tsk_status', label: 'Status', visible: true, order: 1 },
            { fieldId: 'tsk_priority', label: 'Priorität', visible: true, order: 2 },
            { fieldId: 'tsk_hours', label: 'Geschätzte Std.', visible: true, order: 3 },
            { fieldId: 'tsk_due', label: 'Fälligkeitsdatum', visible: true, order: 4 }
          ]
        }
      ],
      pages: getPmTaskBoardPages(t),
      layout: [
        { id: 'tbl_workspace', tableId: 'tbl_workspace', x: 40, y: 60 },
        { id: 'tbl_project', tableId: 'tbl_project', x: 380, y: 60 },
        { id: 'tbl_user', tableId: 'tbl_user', x: 40, y: 380 },
        { id: 'tbl_task', tableId: 'tbl_task', x: 740, y: 60 },
        { id: 'tbl_tag', tableId: 'tbl_tag', x: 1080, y: 380 },
        { id: 'tbl_task_tag', tableId: 'tbl_task_tag', x: 1080, y: 60 },
        { id: 'tbl_comment', tableId: 'tbl_comment', x: 740, y: 380 }
      ],
      tableGroups: [
        { id: 'grp_pm', name: 'Task Board & Collaboration Domain', color: 'indigo' }
      ]
    }
  };
};
