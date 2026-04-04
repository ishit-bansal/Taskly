import { useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useTasks } from './hooks/useTasks'
import { BoardColumn } from './components/BoardColumn'
import { COLUMNS, type TaskStatus, type TaskPriority } from './lib/types'

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 }

function Board() {
  const { user, loading: authLoading, error: authError } = useAuth()
  const { tasks, loading: tasksLoading } = useTasks()

  const getColumnTasks = useCallback((status: TaskStatus) => {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.position - b.position)
  }, [tasks])

  if (authLoading || tasksLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  if (authError || !user) {
    return <div className="h-screen flex items-center justify-center bg-bg text-danger">{authError || 'Auth failed'}</div>
  }

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4">
        <h1 className="text-xl font-bold text-text">Taskly</h1>
      </header>
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {COLUMNS.map(column => (
          <div key={column.id} className="flex-1 min-w-[250px]">
            <BoardColumn
              column={column}
              tasks={getColumnTasks(column.id)}
              getLabelsForTask={() => []}
              getAssigneesForTask={() => []}
              onTaskClick={() => {}}
              onTaskContextMenu={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <Board />
    </AuthProvider>
  )
}
