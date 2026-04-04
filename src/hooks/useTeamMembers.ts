import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TeamMember } from '../lib/types';

export function useTeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('[Taskly] Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const createMember = useCallback(async (name: string, color: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('team_members')
      .insert({ name, color, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setMembers(prev => [...prev, data]);
    return data;
  }, [user]);

  const deleteMember = useCallback(async (memberId: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) throw error;
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }, []);

  const getMember = useCallback((memberId: string | null) => {
    if (!memberId) return null;
    return members.find(m => m.id === memberId) || null;
  }, [members]);

  return {
    members,
    loading,
    createMember,
    deleteMember,
    getMember,
    refetch: fetchMembers,
  };
}
