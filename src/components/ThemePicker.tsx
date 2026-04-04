import React, { useState, useRef, useEffect } from 'react';
import { Check, Paintbrush } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, type ThemeName } from '../contexts/ThemeContext';

const themes: {
  id: ThemeName;
  name: string;
  description: string;
}[] = [
  { id: 'neumorph-dark', name: 'Soft Dark', description: 'Black neumorphic depth' },
  { id: 'neumorph-lavender', name: 'Soft Lavender', description: 'Light purple neumorphic' },
  { id: 'retro', name: 'Retro', description: 'Pixel art & 8-bit vibes' },
];

function DarkPreview() {
  return (
    <div className="w-8 h-8 rounded-md flex-shrink-0 border border-border/30 overflow-hidden relative" style={{ background: '#1a1a1a' }}>
      <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', top: 4, left: 4, background: '#1a1a1a', boxShadow: '2px 2px 4px #0e0e0e, -2px -2px 4px #262626' }} />
      <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', bottom: 4, right: 4, background: '#1a1a1a', boxShadow: '1.5px 1.5px 3px #0e0e0e, -1.5px -1.5px 3px #262626' }} />
      <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', top: 6, right: 6, background: '#e8863a' }} />
    </div>
  );
}

function LavenderPreview() {
  return (
    <div className="w-8 h-8 rounded-md flex-shrink-0 border border-border/30 overflow-hidden relative" style={{ background: '#ddd8e8' }}>
      <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', top: 4, left: 4, background: '#ddd8e8', boxShadow: '2px 2px 4px #bdb8c8, -2px -2px 4px #fdf8ff' }} />
      <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', bottom: 4, right: 4, background: '#ddd8e8', boxShadow: '1.5px 1.5px 3px #bdb8c8, -1.5px -1.5px 3px #fdf8ff' }} />
      <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', top: 6, right: 6, background: '#7c5cbf' }} />
    </div>
  );
}

function RetroPreview() {
  const pixels = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
    '#4d96ff', '#ff6b6b', '#ffd93d', '#6bcb77',
    '#6bcb77', '#4d96ff', '#ff6b6b', '#ffd93d',
  ];
  return (
    <div className="w-8 h-8 flex-shrink-0 border border-border/30 overflow-hidden relative" style={{ background: '#1a1c2c', borderRadius: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, padding: 3, height: '100%', alignContent: 'center' }}>
        {pixels.map((c, i) => (
          <div key={i} style={{ width: 5, height: 5, background: c }} />
        ))}
      </div>
    </div>
  );
}

const previewMap: Record<ThemeName, React.FC> = {
  'neumorph-dark': DarkPreview,
  'neumorph-lavender': LavenderPreview,
  'retro': RetroPreview,
};

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`h-10 w-10 flex items-center justify-center rounded-lg transition-all ${
          open
            ? 'bg-accent-muted text-accent-hover border border-accent/30'
            : 'bg-bg-surface border border-border text-text-secondary hover:text-text hover:border-border-hover'
        }`}
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 w-52 bg-bg-elevated border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            <div className="px-3 pt-2.5 pb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-placeholder">Theme</p>
            </div>
            <div className="px-1.5 pb-1.5 space-y-0.5">
              {themes.map(t => {
                const isActive = theme === t.id;
                const Preview = previewMap[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                      isActive ? 'bg-accent-muted' : 'hover:bg-bg-hover'
                    }`}
                  >
                    <Preview />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text">{t.name}</div>
                      <div className="text-[10px] text-text-placeholder leading-snug">{t.description}</div>
                    </div>

                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
