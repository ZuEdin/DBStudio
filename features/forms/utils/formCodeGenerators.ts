import { Form, Table, FormElement } from '../../../types/index';

/**
 * Multi-Framework Code Generators for Forms
 * Generates production-ready React (React Hook Form + Zod) and Angular 18+ Reactive Forms.
 */

export function generateReactHookFormCode(form: Form, table?: Table): string {
  const formName = form.name.replace(/[^a-zA-Z0-9]/g, '');
  const fields = table?.fields || [];

  const zodFields = fields
    .map((f) => {
      let zodType = 'z.string()';
      if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE' || f.type === 'FLOAT') zodType = 'z.number()';
      else if (f.type === 'BOOLEAN') zodType = 'z.boolean()';
      else if (f.type === 'DATE') zodType = 'z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Ungültiges Datum")';

      const isRequired = (!f.allowNull && !f.isNullable) || Boolean((f as any).required);
      if (!isRequired) zodType += '.optional()';
      return `  ${f.name}: ${zodType},`;
    })
    .join('\n');

  return `import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod Validation Schema
export const ${formName}Schema = z.object({
${zodFields || '  // Keine Tabellenfelder definiert'}
});

export type ${formName}FormData = z.infer<typeof ${formName}Schema>;

interface ${formName}FormProps {
  initialValues?: Partial<${formName}FormData>;
  onSubmit: (data: ${formName}FormData) => Promise<void> | void;
  isReadOnly?: boolean;
}

export const ${formName}Form: React.FC<${formName}FormProps> = ({
  initialValues,
  onSubmit,
  isReadOnly = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<${formName}FormData>({
    resolver: zodResolver(${formName}Schema),
    defaultValues: initialValues as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">${form.name}</h2>

      <div className="grid grid-cols-12 gap-4">
${fields
  .map(
    (f) => `        {/* Feld: ${f.name} */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1">${f.name}</label>
          <input
            {...register('${f.name}'${f.type === 'INTEGER' || f.type === 'DECIMAL' ? ', { valueAsNumber: true }' : ''})}
            disabled={isReadOnly}
            type="${f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}"
            className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {errors.${f.name} && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.${f.name}?.message}</p>
          )}
        </div>`
  )
  .join('\n\n')}
      </div>

      {!isReadOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      )}
    </form>
  );
};
`;
}

export function generateAngularReactiveFormCode(form: Form, table?: Table): string {
  const formName = form.name.replace(/[^a-zA-Z0-9]/g, '');
  const fields = table?.fields || [];

  return `import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-${formName.toLowerCase()}-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: \`
    <form [formGroup]="formGroup" (ngSubmit)="onSave()" class="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4">
      <h2 class="text-xl font-bold text-slate-800 border-b pb-3 mb-4">${form.name}</h2>

      <div class="grid grid-cols-12 gap-4">
${fields
  .map(
    (f) => `        <div class="col-span-12 md:col-span-6">
          <label class="block text-xs font-semibold text-slate-700 mb-1">${f.name}</label>
          <input
            formControlName="${f.name}"
            type="${f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}"
            class="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>`
  )
  .join('\n')}
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          [disabled]="formGroup.invalid || isSaving()"
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          Speichern
        </button>
      </div>
    </form>
  \`
})
export class ${formName}FormComponent implements OnInit {
  @Input() initialData: any = {};
  @Input() isReadOnly: boolean = false;
  @Output() formSubmit = new EventEmitter<any>();

  formGroup!: FormGroup;
  isSaving = signal(false);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
${fields.map((f) => `      ${f.name}: [this.initialData['${f.name}'] || '', ${(!f.allowNull && !f.isNullable) || (f as any).required ? '[Validators.required]' : '[]'}]`).join(',\n')}
    });

    if (this.isReadOnly) {
      this.formGroup.disable();
    }
  }

  onSave(): void {
    if (this.formGroup.valid) {
      this.isSaving.set(true);
      this.formSubmit.emit(this.formGroup.value);
      this.isSaving.set(false);
    }
  }
}
`;
}
