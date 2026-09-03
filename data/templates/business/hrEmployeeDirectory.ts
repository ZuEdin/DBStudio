import { ProjectTemplate, DbType } from '../../../types/index';
import { getHrPages } from '../pages/index';

const dict: Record<string, any> = {
  de: {
    name: 'HR & Mitarbeiterverwaltung (Organigramm & RBAC)',
    desc: 'Hierarchische Vorlage mit Organigramm (ManagerId), rollenbasierter Zugriffskontrolle (RBAC) und digitaler Personalakte mit Dokument-Metadaten.',
    badge: 'HIERARCHIEN & RBAC',
    dep_it: 'IT & Software Engineering',
    dep_finance: 'Finanzen & Controlling',
    dep_bau: 'Bauleitung & Projektsteuerung'
  },
  en: {
    name: 'HR & Employee Directory (Hierarchy & RBAC)',
    desc: 'Hierarchical template with organigram (ManagerId), role-based access control (RBAC), and digital personnel files with document metadata.',
    badge: 'HIERARCHY & RBAC',
    dep_it: 'IT & Software Engineering',
    dep_finance: 'Finance & Controlling',
    dep_bau: 'Site Management & Civil Engineering'
  }
};

export const getHrEmployeeDirectory = (lang: string): ProjectTemplate => {
  const t = dict[lang] || dict['de'];

  return {
    id: 'hr_directory',
    name: t.name,
    description: t.desc,
    icon: 'Users',
    category: 'Business',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'EnterpriseHR',
        port: 5003,
        frontendPort: 3003,
        dbConnection: 'Server=localhost;Database=EnterpriseHR;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: true, devBypass: true, isMobileReady: true }
      },
      tables: [
        {
          id: 'tbl_department',
          name: 'Department',
          fields: [
            { id: 'dep_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'dep_name', name: 'Name', type: 'VARCHAR', length: 100 },
            { id: 'dep_code', name: 'Code', type: 'VARCHAR', length: 20 },
            { id: 'dep_budget', name: 'Budget', type: 'DECIMAL', precision: 12, scale: 2 },
            { id: 'dep_loc', name: 'Location', type: 'VARCHAR', length: 80 }
          ],
          data: [
            { Id: 1, Name: t.dep_bau, Code: 'BL-01', Budget: 850000.00, Location: 'München Zentrale' },
            { Id: 2, Name: t.dep_it, Code: 'IT-DEV', Budget: 620000.00, Location: 'Berlin Hub' },
            { Id: 3, Name: t.dep_finance, Code: 'FIN-ACC', Budget: 340000.00, Location: 'Frankfurt a.M.' }
          ]
        },
        {
          id: 'tbl_employee',
          name: 'Employee',
          fields: [
            { id: 'emp_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'emp_num', name: 'EmployeeNumber', type: 'VARCHAR', length: 30 },
            { id: 'emp_first', name: 'FirstName', type: 'VARCHAR', length: 60 },
            { id: 'emp_last', name: 'LastName', type: 'VARCHAR', length: 60 },
            { id: 'emp_email', name: 'Email', type: 'VARCHAR', length: 120 },
            { id: 'emp_dep_id', name: 'DepartmentId', type: 'INTEGER' },
            { id: 'emp_mgr_id', name: 'ManagerId', type: 'INTEGER' },
            { id: 'emp_title', name: 'JobTitle', type: 'VARCHAR', length: 100 },
            { id: 'emp_hire', name: 'HireDate', type: 'DATE' },
            { id: 'emp_salary', name: 'Salary', type: 'DECIMAL', precision: 10, scale: 2 },
            { id: 'emp_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Active', enumValues: ['Active', 'OnLeave', 'Probation', 'Terminated'] },
            { id: 'emp_avatar', name: 'AvatarUrl', type: 'VARCHAR', length: 255 }
          ],
          data: [
            { Id: 1, EmployeeNumber: 'MA-001', FirstName: 'Dr. Wolfgang', LastName: 'Schenk', Email: 'w.schenk@bau-holding.de', DepartmentId: 1, ManagerId: null, JobTitle: 'Geschäftsführer Technik (CTO)', HireDate: '2018-04-01', Salary: 145000.00, Status: 'Active', AvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
            { Id: 2, EmployeeNumber: 'MA-014', FirstName: 'Sabine', LastName: 'Lindner', Email: 's.lindner@bau-holding.de', DepartmentId: 2, ManagerId: 1, JobTitle: 'Head of Software Architecture', HireDate: '2020-09-15', Salary: 98000.00, Status: 'Active', AvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
            { Id: 3, EmployeeNumber: 'MA-028', FirstName: 'Maximilian', LastName: 'Vogel', Email: 'm.vogel@bau-holding.de', DepartmentId: 2, ManagerId: 2, JobTitle: 'Senior Full-Stack Engineer', HireDate: '2022-01-10', Salary: 76000.00, Status: 'Active', AvatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' },
            { Id: 4, EmployeeNumber: 'MA-042', FirstName: 'Corinna', LastName: 'Frank', Email: 'c.frank@bau-holding.de', DepartmentId: 3, ManagerId: 1, JobTitle: 'Leiterin Finanzen & Bilanzen', HireDate: '2019-06-01', Salary: 92000.00, Status: 'Active', AvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100' }
          ]
        },
        {
          id: 'tbl_role',
          name: 'Role',
          fields: [
            { id: 'rol_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'rol_name', name: 'Name', type: 'VARCHAR', length: 60 },
            { id: 'rol_desc', name: 'Description', type: 'TEXT' },
            { id: 'rol_level', name: 'SecurityLevel', type: 'INTEGER', defaultValue: '1' }
          ],
          data: [
            { Id: 1, Name: 'Executive', Description: 'Unternehmensführung & Vollzugriff auf Gehälter', SecurityLevel: 100 },
            { Id: 2, Name: 'Manager', Description: 'Abteilungsleiter mit Freigabe- und Budgetrechten', SecurityLevel: 50 },
            { Id: 3, Name: 'Staff', Description: 'Mitarbeiter im operativen Projektbetrieb', SecurityLevel: 10 }
          ]
        },
        {
          id: 'tbl_permission',
          name: 'Permission',
          fields: [
            { id: 'perm_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'perm_code', name: 'Code', type: 'VARCHAR', length: 60 },
            { id: 'perm_mod', name: 'Module', type: 'VARCHAR', length: 50 },
            { id: 'perm_act', name: 'Action', type: 'VARCHAR', length: 30, enumValues: ['Read', 'Write', 'Approve', 'Delete', 'Admin'] },
            { id: 'perm_desc', name: 'Description', type: 'TEXT' }
          ],
          data: [
            { Id: 1, Code: 'HR_SALARY_READ', Module: 'HR', Action: 'Read', Description: 'Gehaltsdaten einsehen' },
            { Id: 2, Code: 'HR_EMPLOYEE_WRITE', Module: 'HR', Action: 'Write', Description: 'Mitarbeiterdaten bearbeiten' },
            { Id: 3, Code: 'DOC_CONFIDENTIAL_READ', Module: 'Documents', Action: 'Read', Description: 'Vertrauliche Dokumente öffnen' },
            { Id: 4, Code: 'CALC_PROJECT_APPROVE', Module: 'Calc', Action: 'Approve', Description: 'Kalkulationen über 100k freigeben' }
          ]
        },
        {
          id: 'tbl_employee_role',
          name: 'EmployeeRole',
          fields: [
            { id: 'er_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'er_emp_id', name: 'EmployeeId', type: 'INTEGER' },
            { id: 'er_rol_id', name: 'RoleId', type: 'INTEGER' }
          ],
          data: [
            { Id: 1, EmployeeId: 1, RoleId: 1 },
            { Id: 2, EmployeeId: 2, RoleId: 2 },
            { Id: 3, EmployeeId: 3, RoleId: 3 },
            { Id: 4, EmployeeId: 4, RoleId: 2 }
          ]
        },
        {
          id: 'tbl_role_permission',
          name: 'RolePermission',
          fields: [
            { id: 'rp_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'rp_rol_id', name: 'RoleId', type: 'INTEGER' },
            { id: 'rp_perm_id', name: 'PermissionId', type: 'INTEGER' }
          ],
          data: [
            { Id: 1, RoleId: 1, PermissionId: 1 },
            { Id: 2, RoleId: 1, PermissionId: 2 },
            { Id: 3, RoleId: 1, PermissionId: 3 },
            { Id: 4, RoleId: 1, PermissionId: 4 },
            { Id: 5, RoleId: 2, PermissionId: 2 },
            { Id: 6, RoleId: 2, PermissionId: 4 }
          ]
        },
        {
          id: 'tbl_document',
          name: 'Document',
          fields: [
            { id: 'doc_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'doc_emp_id', name: 'EmployeeId', type: 'INTEGER' },
            { id: 'doc_title', name: 'Title', type: 'VARCHAR', length: 150 },
            { id: 'doc_type', name: 'DocumentType', type: 'VARCHAR', length: 40, enumValues: ['Contract', 'Certificate', 'ID_Proof', 'Evaluation', 'Medical'] },
            { id: 'doc_path', name: 'FilePath', type: 'VARCHAR', length: 255 },
            { id: 'doc_size', name: 'FileSize', type: 'INTEGER' },
            { id: 'doc_mime', name: 'MimeType', type: 'VARCHAR', length: 60, defaultValue: 'application/pdf' },
            { id: 'doc_uploaded', name: 'UploadedAt', type: 'DATETIME' },
            { id: 'doc_conf', name: 'ConfidentialityLevel', type: 'VARCHAR', length: 30, defaultValue: 'Confidential', enumValues: ['Public', 'Internal', 'Confidential', 'StrictlyConfidential'] }
          ],
          data: [
            { Id: 1, EmployeeId: 1, Title: 'Geschäftsführer-Anstellungsvertrag 2018', DocumentType: 'Contract', FilePath: '/storage/hr/docs/gf_vertrag_schenk.pdf', FileSize: 2450000, MimeType: 'application/pdf', UploadedAt: '2018-04-01 10:00:00', ConfidentialityLevel: 'StrictlyConfidential' },
            { Id: 2, EmployeeId: 2, Title: 'IHK Zertifikat Software-Architekt', DocumentType: 'Certificate', FilePath: '/storage/hr/docs/zertifikat_lindner.pdf', FileSize: 890000, MimeType: 'application/pdf', UploadedAt: '2020-09-20 14:15:00', ConfidentialityLevel: 'Internal' },
            { Id: 3, EmployeeId: 3, Title: 'Arbeitsvertrag Full-Stack Entwickler', DocumentType: 'Contract', FilePath: '/storage/hr/docs/vertrag_vogel.pdf', FileSize: 1540000, MimeType: 'application/pdf', UploadedAt: '2022-01-10 09:30:00', ConfidentialityLevel: 'Confidential' }
          ]
        }
      ],
      relationships: [
        { id: 'rel_dep_emp', fromTableId: 'tbl_department', fromFieldId: 'dep_id', toTableId: 'tbl_employee', toFieldId: 'emp_dep_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_mgr_emp', fromTableId: 'tbl_employee', fromFieldId: 'emp_id', toTableId: 'tbl_employee', toFieldId: 'emp_mgr_id', type: '1:n', referentialIntegrity: false },
        { id: 'rel_emp_doc', fromTableId: 'tbl_employee', fromFieldId: 'emp_id', toTableId: 'tbl_document', toFieldId: 'doc_emp_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_emp_er', fromTableId: 'tbl_employee', fromFieldId: 'emp_id', toTableId: 'tbl_employee_role', toFieldId: 'er_emp_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_rol_er', fromTableId: 'tbl_role', fromFieldId: 'rol_id', toTableId: 'tbl_employee_role', toFieldId: 'er_rol_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_rol_rp', fromTableId: 'tbl_role', fromFieldId: 'rol_id', toTableId: 'tbl_role_permission', toFieldId: 'rp_rol_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' },
        { id: 'rel_perm_rp', fromTableId: 'tbl_permission', fromFieldId: 'perm_id', toTableId: 'tbl_role_permission', toFieldId: 'rp_perm_id', type: '1:n', referentialIntegrity: true }
      ],
      queries: [
        {
          id: 'q_organigram_tree',
          type: 'SELECT',
          name: 'Organigramm: Führungskräfte & Unterstellte',
          nodes: [
            { id: 'qn_mgr', tableId: 'tbl_employee', x: 50, y: 50 },
            { id: 'qn_sub', tableId: 'tbl_employee', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc_mgr_name', tableId: 'tbl_employee', fieldId: 'emp_last', tableName: 'Employee', fieldName: 'LastName', sort: 'ASC', show: true, criteria: [''], alias: 'Vorgesetzter' },
            { id: 'qc_sub_first', tableId: 'tbl_employee', fieldId: 'emp_first', tableName: 'Employee', fieldName: 'FirstName', sort: '', show: true, criteria: [''], alias: 'Vorname' },
            { id: 'qc_sub_last', tableId: 'tbl_employee', fieldId: 'emp_last', tableName: 'Employee', fieldName: 'LastName', sort: 'ASC', show: true, criteria: [''], alias: 'Nachname' },
            { id: 'qc_sub_title', tableId: 'tbl_employee', fieldId: 'emp_title', tableName: 'Employee', fieldName: 'JobTitle', sort: '', show: true, criteria: [''], alias: 'Position' }
          ]
        },
        {
          id: 'q_department_payroll',
          type: 'SELECT',
          name: 'Abteilungs-Gehaltsvolumen & Headcount',
          nodes: [
            { id: 'qn_d', tableId: 'tbl_department', x: 50, y: 50 },
            { id: 'qn_e', tableId: 'tbl_employee', x: 280, y: 50 }
          ],
          columns: [
            { id: 'qc_dname', tableId: 'tbl_department', fieldId: 'dep_name', tableName: 'Department', fieldName: 'Name', sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_headcount', tableId: 'tbl_employee', fieldId: 'emp_id', tableName: 'Employee', fieldName: 'Id', sort: '', show: true, criteria: [''], aggregate: 'COUNT', alias: 'Mitarbeiter' },
            { id: 'qc_sum_sal', tableId: 'tbl_employee', fieldId: 'emp_salary', tableName: 'Employee', fieldName: 'Salary', sort: 'DESC', show: true, criteria: [''], aggregate: 'SUM', alias: 'Jahresgehalt_Summe' }
          ]
        }
      ],
      forms: [
        {
          id: 'form_employee_dossier',
          name: 'Mitarbeiter-Dossier & Organigramm',
          sourceType: 'table',
          sourceId: 'tbl_employee',
          fields: [],
          layout: {
            id: 'root_emp',
            type: 'container',
            className: 'p-4 space-y-4 bg-slate-900/60 rounded-xl border border-slate-700',
            children: [
              { id: 'lbl_emp_head', type: 'label', label: 'Mitarbeiterprofil & Hierarchie-Zuordnung', className: 'text-base font-bold text-amber-400' },
              {
                id: 'cnt_emp_grid',
                type: 'container',
                className: 'grid grid-cols-3 gap-3',
                children: [
                  { id: 'f_emp_num', type: 'field', fieldId: 'emp_num', label: 'Personalnummer', widgetType: 'text' },
                  { id: 'f_emp_first', type: 'field', fieldId: 'emp_first', label: 'Vorname', widgetType: 'text' },
                  { id: 'f_emp_last', type: 'field', fieldId: 'emp_last', label: 'Nachname', widgetType: 'text' }
                ]
              },
              {
                id: 'cnt_emp_org',
                type: 'container',
                className: 'grid grid-cols-3 gap-3',
                children: [
                  { id: 'f_emp_dep', type: 'field', fieldId: 'emp_dep_id', label: 'Abteilung', widgetType: 'select', lookup: { tableId: 'tbl_department', valueFieldId: 'dep_id', labelFields: ['dep_name', 'dep_code'] } },
                  { id: 'f_emp_mgr', type: 'field', fieldId: 'emp_mgr_id', label: 'Disziplinarischer Vorgesetzter', widgetType: 'select', lookup: { tableId: 'tbl_employee', valueFieldId: 'emp_id', labelFields: ['emp_last', 'emp_first', 'emp_title'] } },
                  { id: 'f_emp_title', type: 'field', fieldId: 'emp_title', label: 'Funktion / Jobtitel', widgetType: 'text' }
                ]
              },
              {
                id: 'subform_docs',
                type: 'subform',
                label: 'Digitale Personalakte (Verträge, Zertifikate, Zeugnisse)',
                subform: {
                  formId: 'form_doc_sub',
                  masterLinkFieldId: 'emp_id',
                  childLinkFieldId: 'doc_emp_id',
                  canAdd: true,
                  canEdit: true,
                  canDelete: true
                }
              }
            ]
          }
        },
        {
          id: 'form_doc_sub',
          name: 'Document Subform',
          sourceType: 'table',
          sourceId: 'tbl_document',
          fields: [],
          layout: {
            id: 'sub_doc_root',
            type: 'container',
            className: 'grid grid-cols-4 gap-2 p-2 bg-slate-800/80 rounded-lg',
            children: [
              { id: 'f_doc_tit', type: 'field', fieldId: 'doc_title', label: 'Titel', widgetType: 'text' },
              { id: 'f_doc_typ', type: 'field', fieldId: 'doc_type', label: 'Typ', widgetType: 'select' },
              { id: 'f_doc_conf', type: 'field', fieldId: 'doc_conf', label: 'Vertraulichkeit', widgetType: 'select' },
              { id: 'f_doc_path', type: 'field', fieldId: 'doc_path', label: 'Dateipfad / Cloud-URI', widgetType: 'text' }
            ]
          }
        }
      ],
      reports: [
        {
          id: 'rep_hr_compliance',
          name: 'Personalbestand & Compliance Matrix',
          sourceType: 'table',
          sourceId: 'tbl_employee',
          groupingFieldId: 'emp_dep_id',
          summaries: [{ fieldId: 'emp_id', fieldName: 'Id', calculation: 'COUNT' }],
          columns: [
            { fieldId: 'emp_num', label: 'Personal-Nr.', visible: true, order: 0 },
            { fieldId: 'emp_last', label: 'Nachname', visible: true, order: 1 },
            { fieldId: 'emp_first', label: 'Vorname', visible: true, order: 2 },
            { fieldId: 'emp_title', label: 'Position', visible: true, order: 3 },
            { fieldId: 'emp_hire', label: 'Eintrittsdatum', visible: true, order: 4 },
            { fieldId: 'emp_status', label: 'Status', visible: true, order: 5 }
          ]
        }
      ],
      pages: getHrPages(t),
      layout: [
        { id: 'tbl_department', tableId: 'tbl_department', x: 40, y: 60 },
        { id: 'tbl_employee', tableId: 'tbl_employee', x: 380, y: 60 },
        { id: 'tbl_document', tableId: 'tbl_document', x: 740, y: 60 },
        { id: 'tbl_employee_role', tableId: 'tbl_employee_role', x: 380, y: 380 },
        { id: 'tbl_role', tableId: 'tbl_role', x: 740, y: 380 },
        { id: 'tbl_role_permission', tableId: 'tbl_role_permission', x: 1060, y: 380 },
        { id: 'tbl_permission', tableId: 'tbl_permission', x: 1060, y: 60 }
      ],
      tableGroups: [
        { id: 'grp_hr', name: 'HR & Personnel Hierarchy Domain', color: 'amber' }
      ]
    }
  };
};
