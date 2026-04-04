import { useDraggable } from '@dnd-kit/core';
import { Calendar, AlertTriangle, Minus, ArrowDown } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import type { Task, Label, TeamMember } from '../lib/types';

interface TaskCardProps {
  task: Task;
  labels: Label[];
  assignees: TeamMember[];
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const priorityConfig = {
  high: { label: 'High', icon: AlertTriangle, className: 'text-priority-high' },
  normal: { label: 'Med', icon: Minus, className: 'text-text-tertiary' },
  low: { label: 'Low', icon: ArrowDown, className: 'text-text-placeholder' },
};

export function TaskCard({ task, labels, assignees, onClick, onContextMenu }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: task.id, data: { task } });

  const getDueDateInfo = () => {
    if (!task.due_date) return null;
    const date = new Date(task.due_date + 'T00:00:00');
    const overdue = isPast(date) && !isToday(date) && task.status !== 'done';
    const dueSoon = (isToday(date) || isTomorrow(date) || differenceInDays(date, new Date()) <= 2) && task.status !== 'done';
    return {
      text: isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d'),
      overdue,
      dueSoon,
    };
  };

  const dueInfo = getDueDateInfo();
  const priority = priorityConfig[task.priority];
  const PriorityIcon = priority.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`task-card group relative bg-bg-surface border border-border rounded-lg cursor-pointer ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      {...attributes}
      {...listeners}
    >
      <div className="px-4 py-3.5">
        <h3 className={`text-sm leading-relaxed font-medium ${
          task.status === 'done' ? 'line-through text-text-tertiary' : 'text-text'
        }`}>
          {task.title}
        </h3>

        {task.description && (
          <p className="mt-1.5 text-xs text-text-tertiary line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {labels.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {labels.map(label => (
              <span key={label.id} className="px-2 py-0.5 rounded text-[11px] font-medium bg-bg-hover text-text-secondary">
                {label.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${priority.className}`}>
            <PriorityIcon className="w-3.5 h-3.5" />
            {priority.label}
          </span>

          {dueInfo && (
            <span className={`inline-flex items-center gap-1 text-[11px] ${
              dueInfo.overdue ? 'text-danger font-medium' : dueInfo.dueSoon ? 'text-warning' : 'text-text-placeholder'
            }`}>
              <Calendar className="w-3 h-3" />
              {dueInfo.text}
            </span>
          )}

          <div className="flex-1" />

          {assignees.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 justify-end max-w-[min(100%,14rem)]">
              {assignees.map(a => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 text-[11px] text-text-placeholder min-w-0"
                  title={a.name}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: a.color || 'var(--color-text-placeholder)' }}
                  />
                  <span className="truncate">{a.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
