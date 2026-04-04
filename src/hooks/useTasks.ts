import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Task, TaskStatus, TaskPriority } from '../lib/types';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    assignee_id?: string | null;
  }) => {
    if (!user) return null;

    const status = taskData.status || 'todo';
    const statusTasks = tasks.filter(t => t.status === status);
    const maxPosition = statusTasks.length > 0
      ? Math.max(...statusTasks.map(t => t.position))
      : -1;

    const newTask = {
      title: taskData.title,
      description: taskData.description || null,
      status,
      priority: taskData.priority || 'normal',
      due_date: taskData.due_date || null,
      assignee_id: taskData.assignee_id || null,
      user_id: user.id,
      position: maxPosition + 1,
    };

    const { data, error: createError } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (createError) throw createError;

    setTasks(prev => [...prev, data]);

    const details: string[] = [`Created task "${data.title}"`];
    if (data.priority !== 'normal') details.push(`Priority: ${data.priority}`);
    if (data.status !== 'todo') details.push(`Status: ${data.status}`);
    if (data.due_date) details.push(`Due: ${data.due_date}`);

    await supabase.from('activity_log').insert({
      task_id: data.id,
      user_id: user.id,
      action: 'created',
      details: details.join(' · '),
    });

    return data;
  }, [user, tasks]);

  const updateTask = useCallback(async (
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'position'>>
  ) => {
    if (!user) return;

    const oldTask = tasks.find(t => t.id === taskId);

    const { data, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    setTasks(prev => prev.map(t => t.id === taskId ? data : t));

    if (oldTask) {
      const logEntries: { action: string; details: string }[] = [];

      if (updates.status && oldTask.status !== updates.status) {
        const statusLabels: Record<string, string> = {
          todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
        };
        logEntries.push({
          action: 'status_changed',
          details: `Status changed from ${statusLabels[oldTask.status]} to ${statusLabels[updates.status]}`,
        });
      }

      if (updates.priority && oldTask.priority !== updates.priority) {
        logEntries.push({
          action: 'priority_changed',
          details: `Priority changed from ${oldTask.priority} to ${updates.priority}`,
        });
      }

      if (updates.due_date !== undefined && oldTask.due_date !== updates.due_date) {
        logEntries.push({
          action: 'due_date_changed',
          details: updates.due_date
            ? `Due date set to ${updates.due_date}`
            : 'Due date removed',
        });
      }

      if (updates.title && oldTask.title !== updates.title) {
        logEntries.push({
          action: 'title_changed',
          details: `Title changed from "${oldTask.title}" to "${updates.title}"`,
        });
      }

      if (updates.description !== undefined && oldTask.description !== updates.description) {
        logEntries.push({
          action: 'description_changed',
          details: updates.description ? 'Description updated' : 'Description removed',
        });
      }

      if (logEntries.length > 0) {
        await Promise.all(
          logEntries.map(entry =>
            supabase.from('activity_log').insert({
              task_id: taskId,
              user_id: user.id,
              ...entry,
            })
          )
        );
      }
    }

    return data;
  }, [user, tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) throw deleteError;

    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [user]);

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    if (!user) return;

    const oldTask = tasks.find(t => t.id === taskId);
    if (!oldTask) return;

    const columnTasks = tasks
      .filter(t => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const clampedPos = Math.max(0, Math.min(newPosition, columnTasks.length));
    columnTasks.splice(clampedPos, 0, { ...oldTask, status: newStatus });

    const updates = columnTasks.map((t, i) => ({
      id: t.id,
      position: i,
      status: newStatus,
    }));

    setTasks(prev => prev.map(t => {
      const u = updates.find(u => u.id === t.id);
      return u ? { ...t, position: u.position, status: u.status } : t;
    }));

    const dbUpdates = updates.filter(u => {
      const orig = tasks.find(t => t.id === u.id);
      return !orig || orig.position !== u.position || orig.status !== newStatus;
    });

    try {
      const results = await Promise.all(
        dbUpdates.map(u =>
          supabase.from('tasks')
            .update({ position: u.position, status: u.status })
            .eq('id', u.id)
        )
      );
      const failed = results.find(r => r.error);
      if (failed?.error) {
        fetchTasks();
        throw failed.error;
      }
    } catch (err) {
      fetchTasks();
      throw err;
    }

    if (oldTask.status !== newStatus) {
      const statusLabels: Record<string, string> = {
        todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
      };
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'status_changed',
        details: `Status changed from ${statusLabels[oldTask.status]} to ${statusLabels[newStatus]}`,
      });
    }
  }, [user, tasks, fetchTasks]);

  const moveTaskLocally = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    moveTaskLocally,
    refetch: fetchTasks,
  };
}
