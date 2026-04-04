import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const [viewMonth, setViewMonth] = useState(() => selectedDate || new Date());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && selectedDate) setViewMonth(selectedDate);
  }, [open]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleSelect = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border ${
          value
            ? 'bg-bg-surface border-border text-text hover:border-border-hover'
            : 'bg-bg-surface border-border text-text-placeholder hover:border-border-hover'
        }`}
      >
        <Calendar className="w-3 h-3" />
        {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Set date'}
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(null); }}
            className="ml-1 hover:text-text"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1.5 left-0 w-[260px] bg-bg-elevated border border-border rounded-xl shadow-xl shadow-black/30 p-3"
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setViewMonth(v => subMonths(v, 1))}
                className="p-1 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-text">
                {format(viewMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setViewMonth(v => addMonths(v, 1))}
                className="p-1 rounded-md hover:bg-bg-hover text-text-tertiary hover:text-text transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-text-placeholder py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const inMonth = isSameMonth(day, viewMonth);
                const selected = selectedDate && isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(day)}
                    className={`relative w-full aspect-square flex items-center justify-center text-[11px] rounded-lg transition-all ${
                      selected
                        ? 'bg-accent text-white font-medium'
                        : today
                        ? 'text-accent font-medium hover:bg-bg-hover'
                        : inMonth
                        ? 'text-text hover:bg-bg-hover'
                        : 'text-text-placeholder/40 hover:bg-bg-hover/50'
                    }`}
                  >
                    {format(day, 'd')}
                    {today && !selected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-border">
              <button
                onClick={() => { onChange(format(new Date(), 'yyyy-MM-dd')); setOpen(false); }}
                className="flex-1 text-[10px] py-1.5 rounded-md bg-bg-hover text-text-secondary hover:text-text transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => { const t = new Date(); t.setDate(t.getDate() + 1); onChange(format(t, 'yyyy-MM-dd')); setOpen(false); }}
                className="flex-1 text-[10px] py-1.5 rounded-md bg-bg-hover text-text-secondary hover:text-text transition-colors"
              >
                Tomorrow
              </button>
              <button
                onClick={() => { const t = new Date(); t.setDate(t.getDate() + 7); onChange(format(t, 'yyyy-MM-dd')); setOpen(false); }}
                className="flex-1 text-[10px] py-1.5 rounded-md bg-bg-hover text-text-secondary hover:text-text transition-colors"
              >
                Next week
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
