import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: ToastInfo;
  onDismiss: (id: number) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast, onDismiss]);

  const bgColor = toast.type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const Icon = toast.type === 'success' ? CheckCircle : XCircle;

  return (
    <div 
      className={`flex items-center gap-4 text-white p-4 rounded-md shadow-lg animate-in fade-in-5 slide-in-from-bottom-5 ${bgColor}`}
    >
      <Icon size={20} />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastInfo[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
