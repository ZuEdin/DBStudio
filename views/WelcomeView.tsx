import React from 'react';
import { Database } from 'lucide-react';

export const WelcomeView = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <Database size={64} className="mb-4 opacity-50" />
    <h1 className="text-2xl font-light">Willkommen bei DB Studio Pro</h1>
    <p>Wählen Sie ein Objekt aus oder erstellen Sie ein neues.</p>
  </div>
);