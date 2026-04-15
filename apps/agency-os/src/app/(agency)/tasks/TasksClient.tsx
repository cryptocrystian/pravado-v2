'use client';

import { useState, useTransition } from 'react';
import { Plus, Clock, Loader2, CheckSquare, Square } from 'lucide-react';
import { formatDate, STATUS_LABELS } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;
const TASK_TYPES = ['pr', 'content', 'aeo', 'video', 'reporting', 'admin'];

interface Task {
  id: string;
  title: string;
  description?: string;
  type?: string;
  priority: string;
  status: string;
  due_date?: string;
  clients?: { id: string; name: string }[] | { id: string; name: string } | null;
}

interface Props {
  initialTasks: Task[];
  clients: { id: string; name: string }[];
  tenantId: string;
}

export default function TasksClient({ initialTasks, clients, tenantId }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [newTask, setNewTask] = useState({
    title: '',
    type: 'pr',
    priority: 'medium',
    client_id: '',
    due_date: '',
    description: '',
  });

  const grouped = PRIORITY_ORDER.reduce<Record<string, Task[]>>((acc, p) => {
    acc[p] = tasks.filter(t => t.priority === p);
    return acc;
  }, {} as Record<string, Task[]>);

  const overdue = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date()
  );

  async function markDone(taskId: string) {
    setCompleting(taskId);
    try {
      await fetch(`/api/agency/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      // Optimistically remove from list
      startTransition(() => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(null);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/agency/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          type: newTask.type,
          priority: newTask.priority,
          client_id: newTask.client_id || null,
          due_date: newTask.due_date || null,
          description: newTask.description || null,
          tenant_id: tenantId,
          status: 'open',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => [data.data, ...prev]);
        setNewTask({ title: '', type: 'pr', priority: 'medium', client_id: '', due_date: '', description: '' });
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-heading-xl text-white-0 mb-1">Tasks</h1>
          <p className="text-sm text-slate-6">
            {tasks.length} open
            {overdue.length > 0 && (
              <span className="text-semantic-danger ml-2 font-medium">
                · {overdue.length} overdue
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-agency flex items-center gap-2"
        >
          <Plus size={15} />
          Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="panel-card p-5 mb-6">
          <h3 className="text-heading-sm text-white-0 mb-4">New Task</h3>
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white-0 mb-1.5">Title *</label>
              <input
                value={newTask.title}
                onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                placeholder="What needs to be done?"
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-white-0 mb-1.5">Type</label>
                <select
                  value={newTask.type}
                  onChange={e => setNewTask(p => ({ ...p, type: e.target.value }))}
                  className="input-field"
                >
                  {TASK_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white-0 mb-1.5">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
                  className="input-field"
                >
                  {PRIORITY_ORDER.map(p => (
                    <option key={p} value={p}>{STATUS_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white-0 mb-1.5">Client</label>
                <select
                  value={newTask.client_id}
                  onChange={e => setNewTask(p => ({ ...p, client_id: e.target.value }))}
                  className="input-field"
                >
                  <option value="">— None —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white-0 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !newTask.title.trim()}
                className="btn-agency text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task groups */}
      {PRIORITY_ORDER.map(priority => {
        const items = grouped[priority] ?? [];
        if (items.length === 0) return null;
        return (
          <div key={priority} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className={`badge-${priority}`}>{STATUS_LABELS[priority]}</span>
              <span className="text-slate-6">({items.length})</span>
            </h2>
            <div className="panel-card divide-y divide-border-subtle">
              {items.map(task => {
                const client = task.clients as any;
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                const isCompleting = completing === task.id;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-start gap-4 px-5 py-4 transition-opacity',
                      isCompleting && 'opacity-40'
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => markDone(task.id)}
                      disabled={isCompleting}
                      className="mt-0.5 flex-shrink-0 text-slate-6 hover:text-semantic-success transition-colors"
                    >
                      {isCompleting
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Square size={16} />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white-0">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-6 mt-0.5 truncate">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {client && (
                          <span className="text-xs text-slate-6">{client.name}</span>
                        )}
                        {task.type && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-4 text-slate-6 uppercase font-medium tracking-wide">
                            {task.type}
                          </span>
                        )}
                        <span className={`badge-${task.status.replace(/_/g, '-')}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                      </div>
                    </div>

                    {task.due_date && (
                      <div className={cn(
                        'flex items-center gap-1 text-xs flex-shrink-0',
                        isOverdue ? 'text-semantic-danger' : 'text-slate-6'
                      )}>
                        <Clock size={11} />
                        {formatDate(task.due_date, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && !showAddForm && (
        <div className="panel-card py-16 text-center">
          <CheckSquare size={32} className="text-semantic-success mx-auto mb-3" />
          <p className="text-sm text-white-0 font-medium mb-1">All clear</p>
          <p className="text-xs text-slate-6">No open tasks — you're all caught up</p>
        </div>
      )}
    </div>
  );
}
