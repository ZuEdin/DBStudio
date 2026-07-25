export interface LookupConfig {
  tableId: string;
  valueFieldId: string;
  labelFields: string[];
  displayFormat?: { fieldId: string; prefix?: string; suffix?: string }[];
  allowQuickCreate?: boolean;
  quickCreateFormId?: string;
  sort?: { fieldId: string; direction: 'ASC' | 'DESC' };
}

export interface Subform {
  formId: string;
  masterLinkFieldId: string;
  childLinkFieldId: string;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface ActionFlow {
  id: string;
  trigger: 'OnClick' | 'OnChange' | 'OnPageLoad';
  actionType: 'ShowToast' | 'OpenModal' | 'Navigate' | 'ExecuteAPI' | 'SetState';
  toastMessage?: string;
  toastType?: 'success' | 'error' | 'info';
  modalId?: string;
  routeUrl?: string;
  apiEndpoint?: string;
  stateVariableId?: string;
  stateValue?: string;
}

export interface FormValidationRule {
  id: string;
  fieldId: string;
  type: 'required' | 'regex' | 'min' | 'max' | 'custom_js';
  regexPattern?: string;
  minValue?: number;
  maxValue?: number;
  customJsCode?: string;
  errorMessage: string;
}

export interface FormEventHandler {
  id: string;
  event: 'OnCurrent' | 'BeforeUpdate' | 'AfterUpdate' | 'OnClick';
  actionType: 'macro' | 'js_script' | 'toast' | 'open_form' | 'open_report';
  macroId?: string;
  jsCode?: string;
  toastMessage?: string;
  targetId?: string;
}

export interface FormElement {
  id: string;
  type: 'container' | 'field' | 'label' | 'subform' | 'button';
  fieldId?: string;
  label?: string;
  className?: string;
  children?: FormElement[];
  widgetType?: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'select' | 'ad-search' | 'current-user' | 'calculated';
  calculationFormula?: string;
  isCalculated?: boolean;
  lookup?: LookupConfig;
  subform?: Subform;
  actions?: ActionFlow[];
  eventHandlers?: FormEventHandler[];
  allowedRoles?: string[];
  visibilityCondition?: { fieldId: string; operator: 'eq' | 'neq'; value: string };
  validationRules?: FormValidationRule[];
}

export interface FormField {
  fieldId: string;
  label: string;
}

export interface FormSettings {
  isFullScreen?: boolean;
  showEditToggle?: boolean;
  showTableSplitView?: boolean;
}

export interface CrossFieldValidation {
  id: string;
  triggerFieldId: string;
  condition: 'equals' | 'not_equals' | 'not_empty' | 'is_true';
  triggerValue?: string;
  targetFieldId: string;
  action: 'require' | 'hide' | 'disable' | 'validate_after';
  errorMessage?: string;
}

export interface Form {
  id: string;
  name: string;
  sourceType: 'table' | 'query';
  sourceId: string;
  mode?: 'edit' | 'readonly';
  layout?: FormElement;
  fields: FormField[];
  subform?: Subform;
  settings?: FormSettings;
  crossFieldValidations?: CrossFieldValidation[];
  validationRules?: FormValidationRule[];
  eventHandlers?: FormEventHandler[];
  allowedRoles?: string[];
}
