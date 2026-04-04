import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Label } from '../lib/types';

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onCreate: (name: string, color: string) => Promise<unknown>;
  onDelete: (labelId: string) => Promise<void>;
}

const DEFAULT_LABEL_COLOR = '#6b7280';

export function ManageLabelsModal({ isOpen, onClose, labels, onCreate, onDelete }: ManageLabelsModalProps) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await onCreate(newName.trim(), DEFAULT_LABEL_COLOR);
      setNewName('');
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
              <h2 className="text-base font-semibold text-text">Manage Labels</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-tertiary hover:text-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreate} className="mb-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Label name..."
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
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labels.length === 0 ? (
                  <div className="text-center py-8 text-sm text-text-tertiary">
                    No labels yet. Create your first one above.
                  </div>
                ) : (
                  labels.map(label => (
                    <motion.div
                      key={label.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between px-3 py-2.5 bg-bg-surface border border-border rounded-lg group"
                    >
                      <span className="text-sm text-text font-medium">{label.name}</span>
                      <button
                        onClick={() => onDelete(label.id)}
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
