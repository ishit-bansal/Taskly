import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { LayoutGroup } from 'framer-motion';
import { isPast, isToday, differenceInDays } from 'date-fns';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTasks } from './hooks/useTasks';
import { useLabels } from './hooks/useLabels';
import { useTaskAssignees } from './hooks/useTaskAssignees';
import { useTeamMembers } from './hooks/useTeamMembers';
import { Header, type SortOption, type DueDateFilter } from './components/Header';
import { BoardColumn } from './components/BoardColumn';
import { TaskCard } from './components/TaskCard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { ManageLabelsModal } from './components/ManageLabelsModal';
import { ManageTeamModal } from './components/ManageTeamModal';
import { ContextMenu } from './components/ContextMenu';
const StatsPanel = lazy(() => import('./components/StatsPanel').then(m => ({ default: m.StatsPanel })));
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { celebrateTaskCompletion } from './lib/confetti';
import { COLUMNS, type TaskStatus, type TaskPriority, type Task } from './lib/types';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 };

function Board() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const {
    tasks, loading: tasksLoading, error: tasksError,
    createTask, updateTask, deleteTask, moveTask,
    moveTaskLocally, refetch,
  } = useTasks();
  const { labels, getLabelsForTask, createLabel, deleteLabel, addLabelToTask, removeLabelFromTask } = useLabels();
  const { members, createMember, deleteMember } = useTeamMembers();
  const { taskAssignees, getAssigneesForTask, addAssigneeToTask, removeAssigneeFromTask } =
    useTaskAssignees(members);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [labelsModalOpen, setLabelsModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | null>(null);
  const [filterDueDate, setFilterDueDate] = useState<DueDateFilter>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  const [activeId, setActiveId] = useState<string | null>(null);
  const dragOriginalStatusRef = useRef<TaskStatus | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ task: Task; pos: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (ctxMenu) { setCtxMenu(null); return; }
        if (statsOpen) { setStatsOpen(false); return; }
        if (selectedTask) { setSelectedTask(null); return; }
        if (createModalOpen) { setCreateModalOpen(false); return; }
        if (labelsModalOpen) { setLabelsModalOpen(false); return; }
        if (teamModalOpen) { setTeamModalOpen(false); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ctxMenu, selectedTask, createModalOpen, labelsModalOpen, teamModalOpen, statsOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterAssignee) {
        const assignees = getAssigneesForTask(task.id);
        if (!assignees.some(a => a.id === filterAssignee)) return false;
      }

      if (filterLabel) {
        const taskLabelIds = getLabelsForTask(task.id).map(l => l.id);
        if (!taskLabelIds.includes(filterLabel)) return false;
      }

      if (filterDueDate) {
        switch (filterDueDate) {
          case 'overdue':
            if (!task.due_date || task.status === 'done') return false;
            if (!isPast(new Date(task.due_date + 'T00:00:00')) || isToday(new Date(task.due_date + 'T00:00:00'))) return false;
            break;
          case 'today':
            if (!task.due_date || !isToday(new Date(task.due_date + 'T00:00:00'))) return false;
            break;
          case 'this_week': {
            if (!task.due_date) return false;
            const d = new Date(task.due_date + 'T00:00:00');
            const diff = differenceInDays(d, new Date());
            if (diff < 0 || diff > 7) return false;
            break;
          }
          case 'no_date':
            if (task.due_date) return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterDueDate, filterAssignee, filterLabel, getLabelsForTask, getAssigneesForTask]);

  const getColumnTasks = useCallback((status: TaskStatus) => {
    const columnTasks = filteredTasks.filter(t => t.status === status);

    switch (sortBy) {
      case 'priority':
        return columnTasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.position - b.position);
      case 'due_date':
        return columnTasks.sort((a, b) => {
          if (!a.due_date && !b.due_date) return a.position - b.position;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date) || a.position - b.position;
        });
      default:
        return columnTasks.sort((a, b) => a.position - b.position);
    }
  }, [filteredTasks, sortBy]);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find(t => t.id === taskId);
    dragOriginalStatusRef.current = task?.status ?? null;
    setActiveId(taskId);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    let overStatus: TaskStatus | null = null;
    if (COLUMNS.some(c => c.id === over.id)) {
      overStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) overStatus = overTask.status;
    }

    if (overStatus && activeTask.status !== overStatus) {
      moveTaskLocally(activeTask.id, overStatus);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const originalStatus = dragOriginalStatusRef.current;
    dragOriginalStatusRef.current = null;
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;

    let newStatus: TaskStatus;
    if (COLUMNS.some(c => c.id === over.id)) {
      newStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    if (newStatus === originalStatus) return;

    const columnTasks = tasks
      .filter(t => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const newPosition = columnTasks.length;

    if (newStatus === 'done' && originalStatus !== 'done') celebrateTaskCompletion();

    try {
      await moveTask(taskId, newStatus, newPosition);
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.4' } },
    }),
    duration: 200,
    easing: 'ease',
  };

  const handleContextMenu = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ task, pos: { x: e.clientX, y: e.clientY } });
  };

  const handleDuplicate = async (task: Task) => {
    const created = await createTask({
      title: `${task.title} (copy)`,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
    });
    if (created) {
      for (const m of getAssigneesForTask(task.id)) {
        await addAssigneeToTask(created.id, m.id);
      }
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (authLoading || tasksLoading) return <LoadingScreen />;
  if (authError) return <ErrorScreen message={authError} onRetry={() => window.location.reload()} />;
  if (!user) return <ErrorScreen message="Failed to create guest session" onRetry={() => window.location.reload()} />;

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        filterDueDate={filterDueDate}
        onFilterDueDateChange={setFilterDueDate}
        filterAssignee={filterAssignee}
        onFilterAssigneeChange={setFilterAssignee}
        filterLabel={filterLabel}
        onFilterLabelChange={setFilterLabel}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onCreateTask={() => { setCreateModalStatus('todo'); setCreateModalOpen(true); }}
        onManageLabels={() => setLabelsModalOpen(true)}
        onManageTeam={() => setTeamModalOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        members={members}
        labels={labels}
      />

      {tasksError && (
        <div className="flex-shrink-0 px-6 py-2 bg-danger-muted border-b border-danger/20 relative z-10">
          <p className="text-sm text-danger">
            {tasksError}
            <button onClick={refetch} className="ml-2 underline hover:no-underline">Retry</button>
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <LayoutGroup>
            <div className="board-grid">
              {COLUMNS.map(column => (
                <div key={column.id} className="board-column-wrapper">
                  <BoardColumn
                    column={column}
                    tasks={getColumnTasks(column.id)}
                    getLabelsForTask={getLabelsForTask}
                    getAssigneesForTask={getAssigneesForTask}
                    onTaskClick={setSelectedTask}
                    onTaskContextMenu={handleContextMenu}
                  />
                </div>
              ))}
            </div>
          </LayoutGroup>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeTask ? (
              <div className="drag-overlay-card" style={{ width: 'min(340px, 80vw)' }}>
                <TaskCard
                  task={activeTask}
                  labels={getLabelsForTask(activeTask.id)}
                  assignees={getAssigneesForTask(activeTask.id)}
                  onClick={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={createTask}
        onAddAssignee={addAssigneeToTask}
        initialStatus={createModalStatus}
        members={members}
      />

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (taskId, updates) => {
            const updated = await updateTask(taskId, updates);
            if (updated) {
              setSelectedTask(updated);
              if (updates.status === 'done') celebrateTaskCompletion();
            }
          }}
          onDelete={deleteTask}
          labels={labels}
          taskLabels={getLabelsForTask(selectedTask.id)}
          members={members}
          taskAssignees={getAssigneesForTask(selectedTask.id)}
          onAddAssignee={addAssigneeToTask}
          onRemoveAssignee={removeAssigneeFromTask}
          onAddLabel={addLabelToTask}
          onRemoveLabel={removeLabelFromTask}
        />
      )}

      <Suspense fallback={null}>
        <StatsPanel
          isOpen={statsOpen}
          onClose={() => setStatsOpen(false)}
          tasks={tasks}
          members={members}
          taskAssignees={taskAssignees}
        />
      </Suspense>

      <ManageLabelsModal
        isOpen={labelsModalOpen}
        onClose={() => setLabelsModalOpen(false)}
        labels={labels}
        onCreate={createLabel}
        onDelete={deleteLabel}
      />

      <ManageTeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        members={members}
        onCreate={createMember}
        onDelete={deleteMember}
      />

      <ContextMenu
        task={ctxMenu?.task || null}
        position={ctxMenu?.pos || null}
        onClose={() => setCtxMenu(null)}
        onUpdateStatus={async (taskId, status) => {
          if (status === 'done') celebrateTaskCompletion();
          await updateTask(taskId, { status });
        }}
        onDelete={async (taskId) => {
          await deleteTask(taskId);
        }}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Board />
      </AuthProvider>
    </ThemeProvider>
  );
}
