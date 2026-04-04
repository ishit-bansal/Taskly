import { useState, useEffect, useRef } from 'react';
import {
  X, Trash2, MessageSquare, Activity, Send,
  AlertTriangle, Minus, ArrowDown, Clock, CheckCircle,
  Circle, Eye, Edit3, Check, Calendar, User, Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useComments } from '../hooks/useComments';
import { useActivityLog } from '../hooks/useActivityLog';
import { DatePicker } from './DatePicker';
import type { Task, TaskStatus, TaskPriority, Label, TeamMember } from '../lib/types';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<unknown>;
  onDelete: (taskId: string) => Promise<void>;
  labels: Label[];
  taskLabels: Label[];
  members: TeamMember[];
  taskAssignees: TeamMember[];
  onAddAssignee: (taskId: string, memberId: string) => void;
  onRemoveAssignee: (taskId: string, memberId: string) => void;
  onAddLabel: (taskId: string, labelId: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
}

const statusOptions: { value: TaskStatus; icon: typeof Circle; label: string }[] = [
  { value: 'todo', icon: Circle, label: 'To Do' },
  { value: 'in_progress', icon: Clock, label: 'In Progress' },
  { value: 'in_review', icon: Eye, label: 'In Review' },
  { value: 'done', icon: CheckCircle, label: 'Done' },
];

const priorityOptions: { value: TaskPriority; icon: typeof Minus; label: string }[] = [
  { value: 'high', icon: AlertTriangle, label: 'High' },
  { value: 'normal', icon: Minus, label: 'Normal' },
  { value: 'low', icon: ArrowDown, label: 'Low' },
];

const activityIcons: Record<string, typeof Circle> = {
  created: Circle,
  status_changed: Activity,
  priority_changed: AlertTriangle,
  comment_added: MessageSquare,
  due_date_changed: Calendar,
  assignee_changed: User,
  assignee_added: User,
  assignee_removed: User,
  title_changed: Edit3,
  description_changed: Edit3,
  label_added: Tag,
  label_removed: Tag,
};

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
  labels,
  taskLabels,
  members,
  taskAssignees,
  onAddAssignee,
  onRemoveAssignee,
  onAddLabel,
  onRemoveLabel,
}: TaskDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commentText, setCommentText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const prevTaskIdRef = useRef<string | null>(null);

  const { comments, loading: commentsLoading, fetchComments, addComment } = useComments(task?.id || null);
  const { activities, loading: activitiesLoading, fetchActivities } = useActivityLog(task?.id || null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setConfirmDelete(false);

      if (task.id !== prevTaskIdRef.current) {
        prevTaskIdRef.current = task.id;
        fetchComments();
        fetchActivities();
      }
    }
  }, [task, fetchComments, fetchActivities]);

  const refetchActivity = () => {
    setTimeout(() => fetchActivities(), 500);
  };

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
    if (editingDesc && descRef.current) descRef.current.focus();
  }, [editingTitle, editingDesc]);

  if (!task) return null;

  const handleTitleSave = async () => {
    if (title.trim() && title.trim() !== task.title) {
      await onUpdate(task.id, { title: title.trim() });
      refetchActivity();
    }
    setEditingTitle(false);
  };

  const handleDescSave = async () => {
    const newDesc = description.trim() || null;
    if (newDesc !== (task.description || null)) {
      await onUpdate(task.id, { description: newDesc } as Partial<Task>);
    }
    setEditingDesc(false);
  };

  const handlePropertyUpdate = async (updates: Partial<Task>) => {
    await onUpdate(task.id, updates);
    refetchActivity();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(commentText.trim());
    setCommentText('');
    refetchActivity();
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await onDelete(task.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-full max-w-lg bg-bg-elevated border-l border-border h-full overflow-y-auto"
          style={{ willChange: 'transform' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-end gap-1 px-5 py-3 bg-bg-elevated/95 backdrop-blur-sm border-b border-border">
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-all ${
                confirmDelete ? 'bg-danger-muted text-danger' : 'hover:bg-bg-hover text-text-placeholder hover:text-text-secondary'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-placeholder hover:text-text-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {editingTitle ? (
              <input
                ref={titleRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                className="w-full bg-transparent text-lg font-semibold text-text focus:outline-none border-b border-accent pb-1 mb-2"
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="text-lg font-semibold text-text mb-2 cursor-pointer group flex items-center gap-2"
              >
                {task.title}
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity text-text-tertiary" />
              </h2>
            )}

            {editingDesc ? (
              <textarea
                ref={descRef}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={handleDescSave}
                rows={3}
                placeholder="Add description..."
                className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-placeholder focus:outline-none focus:border-accent resize-none mb-5"
              />
            ) : (
              <div onClick={() => setEditingDesc(true)} className="mb-5 cursor-pointer group">
                {task.description ? (
                  <p className="text-sm text-text-secondary leading-relaxed group-hover:text-text transition-colors">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-xs text-text-placeholder">Add a description...</p>
                )}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="w-16 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0">Status</span>
                <div className="flex gap-1 flex-wrap">
                  {statusOptions.map(s => {
                    const Icon = s.icon;
                    const active = task.status === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => handlePropertyUpdate({ status: s.value })}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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

              <div className="flex items-center gap-4">
                <span className="w-16 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0">Priority</span>
                <div className="flex gap-1">
                  {priorityOptions.map(p => {
                    const Icon = p.icon;
                    const active = task.priority === p.value;
                    return (
                      <button
                        key={p.value}
                        onClick={() => handlePropertyUpdate({ priority: p.value })}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
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

              <div className="flex items-center gap-4">
                <span className="w-16 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0">Due</span>
                <DatePicker
                  value={task.due_date}
                  onChange={d => handlePropertyUpdate({ due_date: d } as Partial<Task>)}
                />
              </div>

              <div className="flex items-start gap-4">
                <span className="w-16 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0 mt-1">Assign</span>
                <div className="flex flex-wrap gap-1.5">
                  {members.map(m => {
                    const isActive = taskAssignees.some(a => a.id === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          if (isActive) {
                            onRemoveAssignee(task.id, m.id);
                          } else {
                            onAddAssignee(task.id, m.id);
                          }
                          refetchActivity();
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
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
                    <span className="text-xs text-text-placeholder">No team members</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-16 text-[11px] text-text-placeholder uppercase tracking-wider flex-shrink-0 mt-1">Labels</span>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map(label => {
                    const isActive = taskLabels.some(tl => tl.id === label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => {
                          if (isActive) {
                            onRemoveLabel(task.id, label.id);
                          } else {
                            onAddLabel(task.id, label.id);
                          }
                          refetchActivity();
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                          isActive
                            ? 'bg-bg-active text-text border border-border-hover'
                            : 'text-text-placeholder hover:text-text-secondary hover:bg-bg-hover'
                        }`}
                      >
                        {isActive && <Check className="w-2.5 h-2.5" />}
                        {label.name}
                      </button>
                    );
                  })}
                  {labels.length === 0 && (
                    <span className="text-xs text-text-placeholder">No labels created</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`text-xs font-medium pb-1 transition-all ${
                    activeTab === 'comments'
                      ? 'text-text border-b border-text'
                      : 'text-text-placeholder hover:text-text-secondary'
                  }`}
                >
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => { setActiveTab('activity'); fetchActivities(); }}
                  className={`text-xs font-medium pb-1 transition-all ${
                    activeTab === 'activity'
                      ? 'text-text border-b border-text'
                      : 'text-text-placeholder hover:text-text-secondary'
                  }`}
                >
                  Activity ({activities.length})
                </button>
              </div>

              {activeTab === 'comments' && (
                <div>
                  <form onSubmit={handleCommentSubmit} className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        className="flex-1 bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-placeholder focus:outline-none focus:border-accent"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="p-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-all disabled:opacity-30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                  {commentsLoading ? (
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-xs text-text-placeholder py-6">No comments yet</p>
                  ) : (
                    <div className="space-y-2">
                      {comments.map(comment => (
                        <motion.div key={comment.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-surface border border-border rounded-lg p-3">
                          <p className="text-sm text-text leading-relaxed">{comment.content}</p>
                          <p className="text-[10px] text-text-placeholder mt-1.5 font-mono">
                            {format(new Date(comment.created_at), 'MMM d, yyyy · h:mm a')}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  {activitiesLoading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}</div>
                  ) : activities.length === 0 ? (
                    <p className="text-center text-xs text-text-placeholder py-6">No activity yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map(activity => {
                        const Icon = activityIcons[activity.action] || Activity;
                        return (
                          <div key={activity.id} className="flex items-start gap-2.5">
                            <Icon className="w-3 h-3 text-text-placeholder mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-text-secondary">{activity.details}</p>
                              <p className="text-[10px] text-text-placeholder mt-0.5 font-mono">
                                {format(new Date(activity.created_at), 'MMM d, yyyy · h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border mt-5 pt-3 text-[10px] text-text-placeholder font-mono">
              Created {format(new Date(task.created_at), 'MMM d, yyyy · h:mm a')}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
