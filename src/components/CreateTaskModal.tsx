import { useState, useEffect } from 'react';
import { X, AlertTriangle, Minus, ArrowDown, Circle, Clock, Eye, CheckCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from './DatePicker';
import type { Task, TaskStatus, TaskPriority, TeamMember } from '../lib/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
  }) => Promise<unknown>;
  onAddAssignee: (taskId: string, memberId: string) => Promise<void>;
  initialStatus?: TaskStatus;
  members: TeamMember[];
}

const statusConfig: { value: TaskStatus; icon: typeof Circle; label: string }[] = [
  { value: 'todo', icon: Circle, label: 'To Do' },
  { value: 'in_progress', icon: Clock, label: 'In Progress' },
  { value: 'in_review', icon: Eye, label: 'In Review' },
  { value: 'done', icon: CheckCircle, label: 'Done' },
];

const priorityConfig: { value: TaskPriority; icon: typeof Minus; label: string }[] = [
  { value: 'high', icon: AlertTriangle, label: 'High' },
  { value: 'normal', icon: Minus, label: 'Normal' },
  { value: 'low', icon: ArrowDown, label: 'Low' },
];

export function CreateTaskModal({ isOpen, onClose, onCreate, onAddAssignee, initialStatus = 'todo', members }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority('normal');
      setDueDate(null);
      setAssigneeIds([]);
      setError('');
    }
  }, [isOpen, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate,
      });
      const task = created as Task | null | undefined;
      if (task?.id) {
        for (const memberId of assigneeIds) {
          await onAddAssignee(task.id, memberId);
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            className="relative w-full max-w-md bg-bg-elevated border border-border rounded-xl shadow-2xl shadow-black/40"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Create task</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              {error && (
                <div className="mb-4 p-2.5 bg-danger-muted border border-danger/20 rounded-lg text-xs text-danger">
                  {error}
                </div>
              )}

              <input
                autoFocus
                type="text"
                placeholder="Task title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-medium text-text placeholder-text-placeholder focus:outline-none focus:border-accent transition-all mb-3"
              />

              <textarea
                placeholder="Add a description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-text placeholder-text-placeholder focus:outline-none focus:border-accent resize-none mb-5"
              />

              <div className="space-y-4 mb-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="w-14 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0">Status</span>
                  <div className="flex gap-1 flex-wrap">
                    {statusConfig.map(s => {
                      const Icon = s.icon;
                      const active = status === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStatus(s.value)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                            active
                              ? 'bg-bg-active text-text border border-border-hover'
                              : 'text-text-tertiary hover:text-text hover:bg-bg-hover'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-3">
                  <span className="w-14 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0">Priority</span>
                  <div className="flex gap-1">
                    {priorityConfig.map(p => {
                      const Icon = p.icon;
                      const active = priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                            active
                              ? 'bg-bg-active text-text border border-border-hover'
                              : 'text-text-tertiary hover:text-text hover:bg-bg-hover'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Due date */}
                <div className="flex items-center gap-3">
                  <span className="w-14 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0">Due</span>
                  <DatePicker value={dueDate} onChange={setDueDate} />
                </div>

                {/* Assignees */}
                <div className="flex items-start gap-3">
                  <span className="w-14 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0 mt-1.5">Assign</span>
                  <div className="flex gap-1 flex-wrap">
                    {members.map(m => {
                      const isActive = assigneeIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setAssigneeIds(prev =>
                              isActive ? prev.filter(id => id !== m.id) : [...prev, m.id]
                            );
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                            isActive
                              ? 'bg-bg-active text-text border border-border-hover'
                              : 'text-text-placeholder hover:text-text-secondary hover:bg-bg-hover'
                          }`}
                        >
                          {isActive && <Check className="w-2.5 h-2.5" />}
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: m.color || 'var(--color-text-placeholder)' }}
                          />
                          {m.name}
                        </button>
                      );
                    })}
                    {members.length === 0 && (
                      <span className="text-xs text-text-placeholder py-1.5">No team members</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-text-secondary hover:text-text bg-bg-surface border border-border hover:border-border-hover transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="h-8 px-5 rounded-lg text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create task'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
