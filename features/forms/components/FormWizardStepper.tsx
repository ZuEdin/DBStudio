import React, { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { FormElement, FormValidationErrorItem } from '../../../types/index';

interface FormWizardStepperProps {
  steps: { id: string; label: string; element: FormElement; isOptional?: boolean }[];
  currentStepIndex: number;
  onStepChange: (newStepIndex: number) => void;
  isLinearMode?: boolean;
  errorsByField?: Record<string, FormValidationErrorItem[]>;
}

export const FormWizardStepper: React.FC<FormWizardStepperProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  isLinearMode = true,
  errorsByField = {},
}) => {
  if (!steps || steps.length === 0) return null;

  const totalSteps = steps.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs mb-6">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Schritt {currentStepIndex + 1} von {totalSteps}:{' '}
          <span className="text-blue-600 dark:text-blue-400">{steps[currentStepIndex]?.label}</span>
        </span>
        <span className="text-xs font-mono font-bold text-slate-400">{progressPercent}% abgeschlossen</span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stepper Dots / Badges */}
      <div className="flex items-center justify-between relative overflow-x-auto pb-1">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isClickable = !isLinearMode || idx <= currentStepIndex;

          return (
            <React.Fragment key={step.id || idx}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepChange(idx)}
                className={`flex flex-col items-center gap-1.5 focus:outline-none transition-all group ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                </div>

                <span
                  className={`text-[11px] font-semibold text-center whitespace-nowrap max-w-[100px] truncate ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : isCompleted
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {idx < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                    idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
