import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Comment } from '../lib/types';

export function useComments(taskId: string | null) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('[Taskly] Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId, user]);

  const addComment = useCallback(async (content: string) => {
    if (!taskId || !user) return null;
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: user.id, content })
      .select()
      .single();
    if (error) throw error;
    setComments(prev => [...prev, data]);

    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: user.id,
      action: 'comment_added',
      details: `Added a comment`,
    });

    return data;
  }, [taskId, user]);

  return { comments, loading, fetchComments, addComment };
}
