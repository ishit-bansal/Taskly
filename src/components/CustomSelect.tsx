import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function CustomSelect({ value, onChange, options, className = '' }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find(o => o.value === value);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', () => setOpen(false), true);
    window.addEventListener('resize', () => setOpen(false));
    return () => {
      window.removeEventListener('scroll', () => setOpen(false), true);
      window.removeEventListener('resize', () => setOpen(false));
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); }
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      const idx = options.findIndex(o => o.value === value);
      if (idx < options.length - 1) onChange(options[idx + 1].value);
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      const idx = options.findIndex(o => o.value === value);
      if (idx > 0) onChange(options[idx - 1].value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { if (!open) updatePosition(); setOpen(!open); }}
        onKeyDown={handleKeyDown}
        className={`w-full h-10 flex items-center justify-between gap-2 bg-bg-surface border border-border rounded-lg px-3 text-sm text-text transition-all hover:border-border-hover focus:outline-none ${
          open ? 'border-border-hover' : ''
        }`}
      >
        <span className={`truncate ${selected?.value ? 'text-text' : 'text-text-placeholder'}`}>
          {selected?.label || 'Select'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-placeholder flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[9999] bg-bg-elevated border border-border rounded-lg shadow-lg shadow-black/20 overflow-hidden py-0.5"
              style={{ top: pos.top, left: pos.left, width: pos.width, minWidth: 120 }}
            >
              {options.map(option => {
                const isActive = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                      isActive ? 'text-text bg-bg-hover' : 'text-text-secondary hover:bg-bg-hover hover:text-text'
                    }`}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
