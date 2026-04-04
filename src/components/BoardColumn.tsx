import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { TaskCard } from './TaskCard';
import type { Task, Column, Label, TeamMember } from '../lib/types';

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  getLabelsForTask: (taskId: string) => Label[];
  getAssigneesForTask: (taskId: string) => TeamMember[];
  onTaskClick: (task: Task) => void;
  onTaskContextMenu?: (task: Task, e: React.MouseEvent) => void;
}

export function BoardColumn({
  column,
  tasks,
  getLabelsForTask,
  getAssigneesForTask,
  onTaskClick,
  onTaskContextMenu,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <>
      <div className="flex items-center px-1 pb-2.5">
        <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {column.title}
        </h2>
        <span className="ml-2 text-[10px] font-mono text-text-placeholder">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`column-zone flex-1 overflow-y-auto ${
          isOver ? 'column-zone-over' : ''
        }`}
      >
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            transition={{ layout: { type: 'spring', stiffness: 400, damping: 30 } }}
          >
            <TaskCard
              task={task}
              labels={getLabelsForTask(task.id)}
              assignees={getAssigneesForTask(task.id)}
              onClick={() => onTaskClick(task)}
              onContextMenu={e => onTaskContextMenu?.(task, e)}
            />
          </motion.div>
        ))}

        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center py-12 text-xs text-text-placeholder">
            No tasks
          </div>
        )}
      </div>
    </>
  );
}
