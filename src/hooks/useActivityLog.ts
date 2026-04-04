import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityLog } from '../lib/types';

export function useActivityLog(taskId: string | null) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('[Taskly] Failed to fetch activity log:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  return { activities, loading, fetchActivities };
}
