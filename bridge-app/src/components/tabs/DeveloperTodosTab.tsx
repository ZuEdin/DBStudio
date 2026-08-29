import React, { useState, useEffect } from 'react';
import { 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Trash2, 
  Search, 
  X
} from 'lucide-react';
import { DeveloperTodo } from '../../types/bridge';
import { bridgeApi } from '../../services/bridgeApi';

const DEFAULT_TODOS: DeveloperTodo[] = [
  {
    id: 'todo_1',
    title: 'Automatischen Tauri-Icon Download & Fallback-Provisioning absichern',
    category: 'Tauri & Desktop',
    priority: 'Kritisch',
    status: 'Erledigt',
    assignee: 'Bridge Daemon',
    description: 'Fehlende Tauri-Icons (ico, icns, png) bei jedem Generierungs- und Startzyklus automatisch aus dem lokalen Cache oder GitHub nachladen.'
  },
  {
    id: 'todo_2',
    title: 'Echtzeit-Dateisystem-Watcher für Workspace-Verzeichnis implementieren',
    category: 'Backend & Daemon',
    priority: 'Mittel',
    status: 'Erledigt',
    assignee: 'Backend Team',
    description: 'Erkennt Änderungen an Projektdateien auf der Festplatte sofort und benachrichtigt verbundene Clients via WebSocket.'
  }
];

export const DeveloperTodosTab: React.FC = () => {
  const [todos, setTodos] = useState<DeveloperTodo[]>(DEFAULT_TODOS);
  const [filterCategory, setFilterCategory] = useState<string>('Alle');
  const [filterStatus, setFilterStatus] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Tauri & Desktop');
  const [newPriority, setNewPriority] = useState<DeveloperTodo['priority']>('Hoch');
  const [newAssignee, setNewAssignee] = useState('Developer');
  const [newDescription, setNewDescription] = useState('');

  const loadTodos = async () => {
    try {
      const data = await bridgeApi.getTodos();
      if (Array.isArray(data) && data.length > 0) {
        setTodos(data);
      } else {
        setTodos(DEFAULT_TODOS);
      }
    } catch {
      setTodos(DEFAULT_TODOS);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const saveUpdatedTodos = async (updated: DeveloperTodo[]) => {
    setTodos(updated);
    await bridgeApi.saveTodos(updated);
  };

  const handleToggleStatus = async (id: string) => {
    const updated = todos.map(t => {
      if (t.id === id) {
        const nextStatus: DeveloperTodo['status'] = 
          t.status === 'Erledigt' ? 'Offen' : 
          t.status === 'Offen' ? 'In Bearbeitung' : 'Erledigt';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    await saveUpdatedTodos(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    await saveUpdatedTodos(updated);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTodo: DeveloperTodo = {
      id: 'todo_' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Offen',
      assignee: newAssignee.trim() || 'Developer',
      description: newDescription.trim()
    };

    const updated = [newTodo, ...todos];
    await saveUpdatedTodos(updated);
    
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  const categories = ['Alle', ...Array.from(new Set(todos.map(t => t.category)))];

  const filteredTodos = todos.filter(todo => {
    const matchesCategory = filterCategory === 'Alle' || todo.category === filterCategory;
    const matchesStatus = filterStatus === 'Alle' || todo.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.assignee.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <ListTodo className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">Entwickler-Roadmap & TODOs</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Zentrale Aufgabenliste für das DB Studio Bridge Entwicklungsteam.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Aufgabe hinzufügen</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTodos.map((todo) => (
          <div key={todo.id} className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <button onClick={() => handleToggleStatus(todo.id)} className="mt-0.5">
                {todo.status === 'Erledigt' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-400" />}
              </button>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{todo.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{todo.description}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(todo.id)} className="text-slate-400 hover:text-rose-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
