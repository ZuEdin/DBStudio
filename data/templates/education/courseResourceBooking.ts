import { ProjectTemplate, DbType } from '../../../types/index';
import { getCourseBookingPages } from '../pages/index';

const dict: Record<string, any> = {
  de: {
    name: 'Kurs- & Ressourcenbuchung (Kollisionsprüfung)',
    desc: 'Planungsvorlage mit Raum- und Dozentenbelegung, automatischer Zeitkollisionsprüfung (Start/End-Intervalle) und Teilnehmer-Kapazitätsgrenzen.',
    badge: 'PLANUNG & KOLLISIONEN',
    room_auditorium: 'Hörsaal A (Campus Süd)',
    room_lab: 'CAD/BIM-Schulungslabor 12',
    course_gaeb: 'GAEB & EFB-Preisbildung für Bauleiter',
    course_bim: 'BIM 5D Modellierung & Mengenermittlung'
  },
  en: {
    name: 'Course & Resource Booking (Collision Check)',
    desc: 'Scheduling template with room and instructor allocation, automated time-overlap collision checks, and participant capacity limits.',
    badge: 'SCHEDULING & CONFLICTS',
    room_auditorium: 'Auditorium A (South Campus)',
    room_lab: 'CAD/BIM Training Lab 12',
    course_gaeb: 'GAEB & EFB Pricing for Construction Managers',
    course_bim: 'BIM 5D Modeling & Quantity Takeoff'
  }
};

export const getCourseResourceBooking = (lang: string): ProjectTemplate => {
  const t = dict[lang] || dict['de'];

  return {
    id: 'course_booking',
    name: t.name,
    description: t.desc,
    icon: 'Calendar',
    category: 'Education',
    data: {
      backendConfig: {
        language: 'dotnet',
        dbType: DbType.SQL,
        projectName: 'EnterpriseBooking',
        port: 5005,
        frontendPort: 3005,
        dbConnection: 'Server=localhost;Database=EnterpriseBooking;Trusted_Connection=True;',
        useSwagger: true,
        frontendFramework: 'react',
        authConfig: { useUserLogin: true, useWindowsAuth: false, useAdGroups: false, devBypass: true, isMobileReady: true }
      },
      tables: [
        {
          id: 'tbl_room',
          name: 'Room',
          fields: [
            { id: 'rm_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'rm_num', name: 'RoomNumber', type: 'VARCHAR', length: 30 },
            { id: 'rm_name', name: 'Name', type: 'VARCHAR', length: 100 },
            { id: 'rm_building', name: 'Building', type: 'VARCHAR', length: 60 },
            { id: 'rm_capacity', name: 'MaxCapacity', type: 'INTEGER', defaultValue: '20' },
            { id: 'rm_projector', name: 'HasProjector', type: 'BOOLEAN', defaultValue: 'true' },
            { id: 'rm_whiteboard', name: 'HasWhiteboard', type: 'BOOLEAN', defaultValue: 'true' },
            { id: 'rm_active', name: 'IsActive', type: 'BOOLEAN', defaultValue: 'true' }
          ],
          data: [
            { Id: 1, RoomNumber: 'R-101', Name: t.room_auditorium, Building: 'Hauptgebäude', MaxCapacity: 60, HasProjector: true, HasWhiteboard: true, IsActive: true },
            { Id: 2, RoomNumber: 'LAB-204', Name: t.room_lab, Building: 'Technik-Zentrum', MaxCapacity: 16, HasProjector: true, HasWhiteboard: false, IsActive: true },
            { Id: 3, RoomNumber: 'S-005', Name: 'Seminarraum Einstein', Building: 'Haus C', MaxCapacity: 25, HasProjector: true, HasWhiteboard: true, IsActive: true }
          ]
        },
        {
          id: 'tbl_instructor',
          name: 'Instructor',
          fields: [
            { id: 'ins_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'ins_first', name: 'FirstName', type: 'VARCHAR', length: 60 },
            { id: 'ins_last', name: 'LastName', type: 'VARCHAR', length: 60 },
            { id: 'ins_email', name: 'Email', type: 'VARCHAR', length: 120 },
            { id: 'ins_phone', name: 'Phone', type: 'VARCHAR', length: 30 },
            { id: 'ins_spec', name: 'Specialization', type: 'VARCHAR', length: 100 },
            { id: 'ins_rate', name: 'HourlyRate', type: 'DECIMAL', precision: 8, scale: 2 }
          ],
          data: [
            { Id: 1, FirstName: 'Prof. Dipl.-Ing. Thomas', LastName: 'Kranz', Email: 't.kranz@bauakademie.de', Phone: '+49 89 778899', Specialization: 'GAEB Schnittstellen & VOB/B Vergabe', HourlyRate: 140.00 },
            { Id: 2, FirstName: 'Dr. Julia', LastName: 'Sommer', Email: 'j.sommer@bauakademie.de', Phone: '+49 89 332211', Specialization: 'BIM 5D Planung & Kollisionsprüfung', HourlyRate: 160.00 }
          ]
        },
        {
          id: 'tbl_course',
          name: 'Course',
          fields: [
            { id: 'crs_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'crs_code', name: 'CourseCode', type: 'VARCHAR', length: 30 },
            { id: 'crs_title', name: 'Title', type: 'VARCHAR', length: 150 },
            { id: 'crs_desc', name: 'Description', type: 'TEXT' },
            { id: 'crs_cat', name: 'Category', type: 'VARCHAR', length: 60 },
            { id: 'crs_duration', name: 'DurationHours', type: 'DECIMAL', precision: 5, scale: 2 },
            { id: 'crs_price', name: 'BasePrice', type: 'DECIMAL', precision: 8, scale: 2 }
          ],
          data: [
            { Id: 1, CourseCode: 'BAU-GAEB-01', Title: t.course_gaeb, Description: 'Praxislehrgang zur digitalen Angebotsabgabe und Nachtragskalkulation nach EFB-Formblättern', Category: 'Kalkulation', DurationHours: 16.00, BasePrice: 890.00 },
            { Id: 2, CourseCode: 'BAU-BIM-02', Title: t.course_bim, Description: 'Verknüpfung von 3D-Geometrie mit Terminplanung (4D) und Kostenaufteilung (5D)', Category: 'CAD & BIM', DurationHours: 24.00, BasePrice: 1250.00 }
          ]
        },
        {
          id: 'tbl_session',
          name: 'Session',
          fields: [
            { id: 'ses_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'ses_course_id', name: 'CourseId', type: 'INTEGER' },
            { id: 'ses_room_id', name: 'RoomId', type: 'INTEGER' },
            { id: 'ses_instructor_id', name: 'InstructorId', type: 'INTEGER' },
            { id: 'ses_title', name: 'Title', type: 'VARCHAR', length: 150 },
            { id: 'ses_start', name: 'StartDateTime', type: 'DATETIME' },
            { id: 'ses_end', name: 'EndDateTime', type: 'DATETIME' },
            { id: 'ses_max_p', name: 'MaxParticipants', type: 'INTEGER', defaultValue: '16' },
            { id: 'ses_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Scheduled', enumValues: ['Scheduled', 'InSession', 'Completed', 'Cancelled'] }
          ],
          data: [
            { Id: 1, CourseId: 1, RoomId: 2, InstructorId: 1, Title: 'GAEB Frühjahrs-Kompaktkurs 2026', StartDateTime: '2026-03-16 09:00:00', EndDateTime: '2026-03-17 17:00:00', MaxParticipants: 16, Status: 'Scheduled' },
            { Id: 2, CourseId: 2, RoomId: 2, InstructorId: 2, Title: 'BIM 5D Intensiv-Workshop München', StartDateTime: '2026-03-23 09:00:00', EndDateTime: '2026-03-25 17:00:00', MaxParticipants: 14, Status: 'Scheduled' },
            { Id: 3, CourseId: 1, RoomId: 1, InstructorId: 1, Title: 'GAEB Fachvortrag & Vergaberecht 2026', StartDateTime: '2026-04-06 14:00:00', EndDateTime: '2026-04-06 18:00:00', MaxParticipants: 50, Status: 'Scheduled' }
          ]
        },
        {
          id: 'tbl_enrollment',
          name: 'Enrollment',
          fields: [
            { id: 'enr_id', name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
            { id: 'enr_session_id', name: 'SessionId', type: 'INTEGER' },
            { id: 'enr_student_name', name: 'StudentName', type: 'VARCHAR', length: 100 },
            { id: 'enr_email', name: 'StudentEmail', type: 'VARCHAR', length: 120 },
            { id: 'enr_company', name: 'Company', type: 'VARCHAR', length: 120 },
            { id: 'enr_date', name: 'EnrollmentDate', type: 'DATETIME' },
            { id: 'enr_status', name: 'Status', type: 'VARCHAR', length: 30, defaultValue: 'Confirmed', enumValues: ['Confirmed', 'Waitlisted', 'Cancelled'] },
            { id: 'enr_payment', name: 'PaymentStatus', type: 'VARCHAR', length: 30, defaultValue: 'Pending', enumValues: ['Pending', 'Paid', 'Refunded'] }
          ],
          data: [
            { Id: 1, SessionId: 1, StudentName: 'Stefan Bergmann', StudentEmail: 'bergmann@strabag-partner.de', Company: 'Strabag Hochbau', EnrollmentDate: '2026-02-10 11:20:00', Status: 'Confirmed', PaymentStatus: 'Paid' },
            { Id: 2, SessionId: 1, StudentName: 'Sandra Klein', StudentEmail: 's.klein@zueblin-bau.de', Company: 'Züblin AG', EnrollmentDate: '2026-02-12 14:30:00', Status: 'Confirmed', PaymentStatus: 'Paid' },
            { Id: 3, SessionId: 2, StudentName: 'Florian Huber', StudentEmail: 'f.huber@huber-planung.de', Company: 'Huber Ingenieure', EnrollmentDate: '2026-02-20 09:15:00', Status: 'Confirmed', PaymentStatus: 'Pending' }
          ]
        }
      ],
      relationships: [
        { id: 'rel_crs_ses', fromTableId: 'tbl_course', fromFieldId: 'crs_id', toTableId: 'tbl_session', toFieldId: 'ses_course_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_rm_ses', fromTableId: 'tbl_room', fromFieldId: 'rm_id', toTableId: 'tbl_session', toFieldId: 'ses_room_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_ins_ses', fromTableId: 'tbl_instructor', fromFieldId: 'ins_id', toTableId: 'tbl_session', toFieldId: 'ses_instructor_id', type: '1:n', referentialIntegrity: true },
        { id: 'rel_ses_enr', fromTableId: 'tbl_session', fromFieldId: 'ses_id', toTableId: 'tbl_enrollment', toFieldId: 'enr_session_id', type: '1:n', referentialIntegrity: true, onDelete: 'CASCADE' }
      ],
      queries: [
        {
          id: 'q_room_collision_check',
          type: 'SELECT',
          name: 'Raum-Kollisionsprüfung (Überschneidungen)',
          nodes: [
            { id: 'qn_s', tableId: 'tbl_session', x: 50, y: 50 },
            { id: 'qn_r', tableId: 'tbl_room', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc_rnum', tableId: 'tbl_room', fieldId: 'rm_num', tableName: 'Room', fieldName: 'RoomNumber', sort: 'ASC', show: true, criteria: [''] },
            { id: 'qc_rname', tableId: 'tbl_room', fieldId: 'rm_name', tableName: 'Room', fieldName: 'Name', sort: '', show: true, criteria: [''] },
            { id: 'qc_start', tableId: 'tbl_session', fieldId: 'ses_start', tableName: 'Session', fieldName: 'StartDateTime', sort: 'ASC', show: true, criteria: [''] },
            { id: 'qc_end', tableId: 'tbl_session', fieldId: 'ses_end', tableName: 'Session', fieldName: 'EndDateTime', sort: '', show: true, criteria: [''] }
          ]
        },
        {
          id: 'q_session_capacity_utilization',
          type: 'SELECT',
          name: 'Kurs-Auslastung & Freie Plätze',
          nodes: [
            { id: 'qn_ses', tableId: 'tbl_session', x: 50, y: 50 },
            { id: 'qn_enr', tableId: 'tbl_enrollment', x: 300, y: 50 }
          ],
          columns: [
            { id: 'qc_stit', tableId: 'tbl_session', fieldId: 'ses_title', tableName: 'Session', fieldName: 'Title', sort: 'ASC', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_max', tableId: 'tbl_session', fieldId: 'ses_max_p', tableName: 'Session', fieldName: 'MaxParticipants', sort: '', show: true, criteria: [''], aggregate: 'GROUP_BY' },
            { id: 'qc_booked', tableId: 'tbl_enrollment', fieldId: 'enr_id', tableName: 'Enrollment', fieldName: 'Id', sort: '', show: true, criteria: [''], aggregate: 'COUNT', alias: 'BelegtePlaetze' }
          ]
        }
      ],
      forms: [
        {
          id: 'form_session_planner',
          name: 'Seminar- & Raumbelegungs-Maske',
          sourceType: 'table',
          sourceId: 'tbl_session',
          fields: [],
          layout: {
            id: 'root_ses',
            type: 'container',
            className: 'p-4 space-y-4 bg-slate-900/60 rounded-xl border border-slate-700',
            children: [
              { id: 'lbl_ses_h', type: 'label', label: 'Veranstaltungsplanung & Raumreservierung', className: 'text-base font-bold text-rose-400' },
              { id: 'f_ses_tit', type: 'field', fieldId: 'ses_title', label: 'Seminartitel', widgetType: 'text' },
              {
                id: 'cnt_ses_res',
                type: 'container',
                className: 'grid grid-cols-3 gap-3',
                children: [
                  { id: 'f_ses_crs', type: 'field', fieldId: 'ses_course_id', label: 'Kurs-Vorlage', widgetType: 'select', lookup: { tableId: 'tbl_course', valueFieldId: 'crs_id', labelFields: ['crs_code', 'crs_title'] } },
                  { id: 'f_ses_rm', type: 'field', fieldId: 'ses_room_id', label: 'Schulungsraum (Kapazitätsprüfung)', widgetType: 'select', lookup: { tableId: 'tbl_room', valueFieldId: 'rm_id', labelFields: ['rm_num', 'rm_name', 'rm_capacity'] } },
                  { id: 'f_ses_ins', type: 'field', fieldId: 'ses_instructor_id', label: 'Dozent / Trainer', widgetType: 'select', lookup: { tableId: 'tbl_instructor', valueFieldId: 'ins_id', labelFields: ['ins_last', 'ins_first', 'ins_spec'] } }
                ]
              },
              {
                id: 'cnt_ses_time',
                type: 'container',
                className: 'grid grid-cols-2 gap-3',
                children: [
                  { id: 'f_ses_st', type: 'field', fieldId: 'ses_start', label: 'Beginn (Datum & Uhrzeit)', widgetType: 'datetime-local' },
                  { id: 'f_ses_en', type: 'field', fieldId: 'ses_end', label: 'Ende (Datum & Uhrzeit)', widgetType: 'datetime-local' }
                ]
              },
              {
                id: 'subform_enr',
                type: 'subform',
                label: 'Teilnehmer-Anmeldungen (Live-Buchungsliste)',
                subform: {
                  formId: 'form_enrollment_sub',
                  masterLinkFieldId: 'ses_id',
                  childLinkFieldId: 'enr_session_id',
                  canAdd: true,
                  canEdit: true,
                  canDelete: true
                }
              }
            ]
          }
        },
        {
          id: 'form_enrollment_sub',
          name: 'Enrollment Subform',
          sourceType: 'table',
          sourceId: 'tbl_enrollment',
          fields: [],
          layout: {
            id: 'sub_enr_root',
            type: 'container',
            className: 'grid grid-cols-4 gap-2 p-2 bg-slate-800/80 rounded-lg',
            children: [
              { id: 'f_enr_name', type: 'field', fieldId: 'enr_student_name', label: 'Teilnehmer', widgetType: 'text' },
              { id: 'f_enr_comp', type: 'field', fieldId: 'enr_company', label: 'Unternehmen', widgetType: 'text' },
              { id: 'f_enr_stat', type: 'field', fieldId: 'enr_status', label: 'Status', widgetType: 'select' },
              { id: 'f_enr_pay', type: 'field', fieldId: 'enr_payment', label: 'Zahlung', widgetType: 'select' }
            ]
          }
        }
      ],
      reports: [
        {
          id: 'rep_session_schedule',
          name: 'Seminar-Kalender & Dozentenplan',
          sourceType: 'table',
          sourceId: 'tbl_session',
          groupingFieldId: 'ses_room_id',
          summaries: [{ fieldId: 'ses_id', fieldName: 'Id', calculation: 'COUNT' }],
          columns: [
            { fieldId: 'ses_title', label: 'Seminar', visible: true, order: 0 },
            { fieldId: 'ses_start', label: 'Von', visible: true, order: 1 },
            { fieldId: 'ses_end', label: 'Bis', visible: true, order: 2 },
            { fieldId: 'ses_status', label: 'Status', visible: true, order: 3 }
          ]
        }
      ],
      pages: getCourseBookingPages(t),
      layout: [
        { id: 'tbl_room', tableId: 'tbl_room', x: 40, y: 60 },
        { id: 'tbl_instructor', tableId: 'tbl_instructor', x: 40, y: 380 },
        { id: 'tbl_course', tableId: 'tbl_course', x: 380, y: 60 },
        { id: 'tbl_session', tableId: 'tbl_session', x: 740, y: 60 },
        { id: 'tbl_enrollment', tableId: 'tbl_enrollment', x: 740, y: 380 }
      ],
      tableGroups: [
        { id: 'grp_booking', name: 'Course Scheduling & Resources Domain', color: 'rose' }
      ]
    }
  };
};
