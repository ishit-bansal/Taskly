import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TaskAssignee, TeamMember } from '../lib/types';

export function useTaskAssignees(members: TeamMember[]) {
  const { user } = useAuth();
  const [taskAssignees, setTaskAssignees] = useState<TaskAssignee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTaskAssignees = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('task_assignees').select('*');
      if (error) throw error;
      setTaskAssignees(data || []);
    } catch (err) {
      console.error('[Taskly] Failed to fetch task assignees:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTaskAssignees();
  }, [fetchTaskAssignees]);

  const addAssigneeToTask = useCallback(async (taskId: string, memberId: string) => {
    const exists = taskAssignees.some(ta => ta.task_id === taskId && ta.member_id === memberId);
    if (exists) return;
    const { error } = await supabase
      .from('task_assignees')
      .insert({ task_id: taskId, member_id: memberId });
    if (error) throw error;
    setTaskAssignees(prev => [...prev, { task_id: taskId, member_id: memberId }]);

    const member = members.find(m => m.id === memberId);
    if (user && member) {
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'assignee_added',
        details: `Assignee "${member.name}" added`,
      });
    }
  }, [taskAssignees, members, user]);

  const removeAssigneeFromTask = useCallback(async (taskId: string, memberId: string) => {
    const { error } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId)
      .eq('member_id', memberId);
    if (error) throw error;
    setTaskAssignees(prev => prev.filter(ta => !(ta.task_id === taskId && ta.member_id === memberId)));

    const member = members.find(m => m.id === memberId);
    if (user && member) {
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'assignee_removed',
        details: `Assignee "${member.name}" removed`,
      });
    }
  }, [members, user]);

  const getAssigneesForTask = useCallback(
    (taskId: string) => {
      const memberIds = taskAssignees.filter(ta => ta.task_id === taskId).map(ta => ta.member_id);
      return members.filter(m => memberIds.includes(m.id));
    },
    [members, taskAssignees]
  );

  return {
    taskAssignees,
    loading,
    addAssigneeToTask,
    removeAssigneeFromTask,
    getAssigneesForTask,
    refetch: fetchTaskAssignees,
  };
}
