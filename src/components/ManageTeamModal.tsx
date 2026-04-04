import { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TeamMember } from '../lib/types';
import { LABEL_COLORS } from '../lib/types';

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  onCreate: (name: string, color: string) => Promise<unknown>;
  onDelete: (memberId: string) => Promise<void>;
}

export function ManageTeamModal({ isOpen, onClose, members, onCreate, onDelete }: ManageTeamModalProps) {
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[8]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await onCreate(newName.trim(), selectedColor);
      setNewName('');
      setSelectedColor(LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            className="relative w-full max-w-md bg-bg-elevated border border-border rounded-xl shadow-2xl shadow-black/40"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-text flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Team Members
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreate} className="mb-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Member name..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="flex-1 bg-bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-placeholder focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newName.trim()}
                    className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {LABEL_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-bg-elevated' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties}
                    />
                  ))}
                </div>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-text-placeholder mx-auto mb-2" />
                    <p className="text-sm text-text-tertiary">No team members yet</p>
                    <p className="text-xs text-text-placeholder mt-1">Add members to assign tasks to them</p>
                  </div>
                ) : (
                  members.map(member => (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between px-3 py-2.5 bg-bg-surface border border-border rounded-lg group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-text font-medium">{member.name}</span>
                      </div>
                      <button
                        onClick={() => onDelete(member.id)}
                        className="p-1.5 rounded-lg text-text-placeholder hover:text-text-secondary hover:bg-bg-hover transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
