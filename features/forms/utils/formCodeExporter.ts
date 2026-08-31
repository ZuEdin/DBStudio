import { Form, FormElement, Table } from '../../../types/index';

export const generateReactFormCode = (form: Form, sourceTable?: Table): string => {
  const fields = form.fields || [];

  return `import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Zod Validation Schema
const formSchema = z.object({
${fields
  .map((f) => `  ${f.fieldId}: z.string().min(1, "${f.label} ist erforderlich"),`)
  .join('\n')}
});

type FormValues = z.infer<typeof formSchema>;

export const ${form.name.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedForm'}: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl space-y-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4">${form.name}</h2>

${fields
  .map(
    (f) => `      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700">${f.label}</label>
        <input
          {...register('${f.fieldId}')}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {errors.${f.fieldId} && (
          <p className="text-xs text-rose-600">{errors.${f.fieldId}?.message}</p>
        )}
      </div>`
  )
  .join('\n\n')}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm"
      >
        Speichern
      </button>
    </form>
  );
};
`;
};

export const generateVueFormCode = (form: Form, sourceTable?: Table): string => {
  const fields = form.fields || [];

  return `<script setup lang="ts">
import { useForm, useField } from 'vee-validate';
import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

const schema = toTypedSchema(
  z.object({
${fields
  .map((f) => `    ${f.fieldId}: z.string().min(1, "${f.label} ist erforderlich"),`)
  .join('\n')}
  })
);

const { handleSubmit, errors } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit((values) => {
  console.log('Vue Form submitted:', values);
});
</script>

<template>
  <form @submit="onSubmit" class="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl space-y-4">
    <h2 class="text-xl font-bold text-slate-800 mb-4">${form.name}</h2>

${fields
  .map(
    (f) => `    <div class="space-y-1">
      <label class="block text-xs font-bold text-slate-700">${f.label}</label>
      <input
        v-model="${f.fieldId}"
        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <p v-if="errors.${f.fieldId}" class="text-xs text-rose-600">{{ errors.${f.fieldId} }}</p>
    </div>`
  )
  .join('\n\n')}

    <button
      type="submit"
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm"
    >
      Speichern
    </button>
  </form>
</template>
`;
};
