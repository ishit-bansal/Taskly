import { AuthProvider, useAuth } from './contexts/AuthContext'
import { COLUMNS } from './lib/types'

function Board() {
  const { loading, error } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg text-danger">
        {error}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg">
      <header className="flex-shrink-0 px-6 py-4">
        <h1 className="text-xl font-bold text-text">Taskly</h1>
      </header>
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-1 min-w-[250px]">
            <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              {col.title}
            </h2>
            <div className="min-h-[200px] rounded-lg p-3">
              <p className="text-xs text-text-placeholder text-center py-8">No tasks yet</p>
            </div>
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
