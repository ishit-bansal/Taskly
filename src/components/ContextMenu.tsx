import { useEffect, useRef } from 'react';
import {
  ArrowRight, Trash2,
  Clock, Eye, CheckCircle, Circle,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskStatus } from '../lib/types';

interface ContextMenuProps {
  task: Task | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
}

const statusOptions: { value: TaskStatus; label: string; icon: typeof Circle }[] = [
  { value: 'todo', label: 'To Do', icon: Circle },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'in_review', label: 'In Review', icon: Eye },
  { value: 'done', label: 'Done', icon: CheckCircle },
];

export function ContextMenu({
  task, position, onClose, onUpdateStatus, onDelete, onDuplicate,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  if (!task || !position) return null;

  const menuStyle: React.CSSProperties = {
    top: Math.min(position.y, window.innerHeight - 240),
    left: Math.min(position.x, window.innerWidth - 200),
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.08 }}
        className="fixed z-[200] w-44 bg-bg-elevated border border-border rounded-lg shadow-xl shadow-black/30 overflow-hidden py-0.5"
        style={menuStyle}
      >
        <MenuItem icon={Copy} label="Duplicate" onClick={() => { onDuplicate(task); onClose(); }} />

        <div className="h-px bg-border my-0.5 mx-2" />

        <div className="px-2 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wider text-text-placeholder px-1">Move to</span>
        </div>
        {statusOptions.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.value}
              onClick={() => { onUpdateStatus(task.id, s.value); onClose(); }}
              disabled={task.status === s.value}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                task.status === s.value
                  ? 'text-text-placeholder'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text'
              }`}
            >
              <Icon className="w-3 h-3" />
              {s.label}
              {task.status === s.value && <ArrowRight className="w-2.5 h-2.5 ml-auto text-text-placeholder" />}
            </button>
          );
        })}

        <div className="h-px bg-border my-0.5 mx-2" />

        <MenuItem icon={Trash2} label="Delete" onClick={() => { onDelete(task.id); onClose(); }} danger />
      </motion.div>
    </AnimatePresence>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: {
  icon: typeof Copy; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
        danger
          ? 'text-danger hover:bg-danger-muted'
          : 'text-text-secondary hover:bg-bg-hover hover:text-text'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}
