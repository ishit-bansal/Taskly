import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Label, TaskLabel } from '../lib/types';

export function useLabels() {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabels = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [labelsRes, taskLabelsRes] = await Promise.all([
        supabase.from('labels').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('task_labels').select('*'),
      ]);

      if (labelsRes.error) throw labelsRes.error;
      if (taskLabelsRes.error) throw taskLabelsRes.error;
      setLabels(labelsRes.data || []);
      setTaskLabels(taskLabelsRes.data || []);
    } catch (err) {
      console.error('[Taskly] Failed to fetch labels:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = useCallback(async (name: string, color: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('labels')
      .insert({ name, color, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setLabels(prev => [...prev, data]);
    return data;
  }, [user]);

  const deleteLabel = useCallback(async (labelId: string) => {
    const { error } = await supabase.from('labels').delete().eq('id', labelId);
    if (error) throw error;
    setLabels(prev => prev.filter(l => l.id !== labelId));
    setTaskLabels(prev => prev.filter(tl => tl.label_id !== labelId));
  }, []);

  const addLabelToTask = useCallback(async (taskId: string, labelId: string) => {
    const exists = taskLabels.some(tl => tl.task_id === taskId && tl.label_id === labelId);
    if (exists) return;
    const { error } = await supabase.from('task_labels').insert({ task_id: taskId, label_id: labelId });
    if (error) throw error;
    setTaskLabels(prev => [...prev, { task_id: taskId, label_id: labelId }]);

    const label = labels.find(l => l.id === labelId);
    if (user && label) {
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'label_added',
        details: `Label "${label.name}" added`,
      });
    }
  }, [taskLabels, labels, user]);

  const removeLabelFromTask = useCallback(async (taskId: string, labelId: string) => {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId);
    if (error) throw error;
    setTaskLabels(prev => prev.filter(tl => !(tl.task_id === taskId && tl.label_id === labelId)));

    const label = labels.find(l => l.id === labelId);
    if (user && label) {
      await supabase.from('activity_log').insert({
        task_id: taskId,
        user_id: user.id,
        action: 'label_removed',
        details: `Label "${label.name}" removed`,
      });
    }
  }, [labels, user]);

  const getLabelsForTask = useCallback((taskId: string) => {
    const labelIds = taskLabels.filter(tl => tl.task_id === taskId).map(tl => tl.label_id);
    return labels.filter(l => labelIds.includes(l.id));
  }, [labels, taskLabels]);

  return {
    labels,
    taskLabels,
    loading,
    createLabel,
    deleteLabel,
    addLabelToTask,
    removeLabelFromTask,
    getLabelsForTask,
    refetch: fetchLabels,
  };
}
