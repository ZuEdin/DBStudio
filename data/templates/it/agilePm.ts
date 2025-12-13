
import { ProjectTemplate, DbType } from '../../../types/index';

export const agilePm: ProjectTemplate = {
    id: 'agile_pm',
    name: 'Agile Project Tracker',
    description: 'Projektmanagement mit User-Login, Tasks, Sprints und Zeiterfassung. Ideal für .NET Backends.',
    icon: 'Kanban',
    category: 'IT',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'AgileTracker',
        port: 5001,
        dbConnection: 'Server=.;Database=AgileTracker;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true }
      },
      tables: [
        {
          id: 'sys_users', name: 'Users',
          fields: [
            { id: 'u1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'u2', name: 'Username', type: 'VARCHAR', length: 50 },
            { id: 'u3', name: 'PasswordHash', type: 'VARCHAR', length: 255 },
            { id: 'u4', name: 'Role', type: 'VARCHAR', length: 20 }
          ],
          data: [{ Id: 1, Username: 'admin', PasswordHash: 'hash123', Role: 'Admin' }]
        },
        {
          id: 't_proj', name: 'Projects',
          fields: [
            { id: 'pr1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'pr2', name: 'Title', type: 'VARCHAR', length: 100 },
            { id: 'pr3', name: 'Description', type: 'TEXT' },
            { id: 'pr4', name: 'StartDate', type: 'DATE' }
          ],
          data: [{ Id: 1, Title: 'Website Relaunch', Description: 'Neues Design 2024', StartDate: '2024-01-01' }]
        },
        {
          id: 't_task', name: 'Tasks',
          fields: [
            { id: 'tk1', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'tk2', name: 'ProjectId', type: 'INTEGER' },
            { id: 'tk3', name: 'AssignedUserId', type: 'INTEGER', allowNull: true },
            { id: 'tk4', name: 'Title', type: 'VARCHAR', length: 200 },
            { id: 'tk5', name: 'Status', type: 'VARCHAR', length: 20, defaultValue: 'Todo' },
            { id: 'tk6', name: 'Estimation', type: 'INTEGER' } // Hours
          ],
          data: [
            { Id: 1, ProjectId: 1, AssignedUserId: 1, Title: 'Setup Repo', Status: 'Done', Estimation: 2 },
            { Id: 2, ProjectId: 1, AssignedUserId: null, Title: 'Design Mockups', Status: 'In Progress', Estimation: 8 }
          ]
        }
      ],
      relationships: [
        { id: 'rel_proj_task', fromTableId: 't_proj', fromFieldId: 'pr1', toTableId: 't_task', toFieldId: 'tk2', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_user_task', fromTableId: 'sys_users', fromFieldId: 'u1', toTableId: 't_task', toFieldId: 'tk3', type: '1:n', referentialIntegrity: false, onDelete: 'SET NULL' }
      ],
      queries: [
        {
          id: 'q_open_tasks', type: 'SELECT', name: 'Offene Tasks',
          nodes: [{ id: 'n1', tableId: 't_task', x: 50, y: 50 }],
          columns: [
            { id: 'c1', tableId: 't_task', fieldId: 'tk4', tableName: 'Tasks', fieldName: 'Title', sort: '', show: true, criteria: [''] },
            { id: 'c2', tableId: 't_task', fieldId: 'tk5', tableName: 'Tasks', fieldName: 'Status', sort: '', show: true, criteria: ['!= "Done"'] }
          ]
        }
      ],
      forms: [],
      reports: []
    }
};
