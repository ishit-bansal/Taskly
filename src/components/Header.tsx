import { useState } from 'react';
import { Search, Plus, X, Users, Tags, ArrowUpDown, BarChart3, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemePicker } from './ThemePicker';
import { CustomSelect } from './CustomSelect';
import type { TaskPriority, Label, TeamMember } from '../lib/types';

export type SortOption = 'priority' | 'due_date';
export type DueDateFilter = '' | 'overdue' | 'today' | 'this_week' | 'no_date';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterPriority: TaskPriority | null;
  onFilterPriorityChange: (priority: TaskPriority | null) => void;
  filterDueDate: DueDateFilter;
  onFilterDueDateChange: (filter: DueDateFilter) => void;
  filterAssignee: string;
  onFilterAssigneeChange: (id: string) => void;
  filterLabel: string;
  onFilterLabelChange: (id: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onCreateTask: () => void;
  onManageLabels: () => void;
  onManageTeam: () => void;
  onOpenStats: () => void;
  members: TeamMember[];
  labels: Label[];
}

export function Header({
  searchQuery,
  onSearchChange,
  filterPriority,
  onFilterPriorityChange,
  filterDueDate,
  onFilterDueDateChange,
  filterAssignee,
  onFilterAssigneeChange,
  filterLabel,
  onFilterLabelChange,
  sortBy,
  onSortChange,
  onCreateTask,
  onManageLabels,
  onManageTeam,
  onOpenStats,
  members,
  labels,
}: HeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = !!filterPriority || !!filterDueDate || !!filterAssignee || !!filterLabel;

  const memberOptions = [
    { value: '', label: 'Assignee' },
    ...members.map(m => ({ value: m.id, label: m.name })),
  ];

  const labelOptions = [
    { value: '', label: 'Label' },
    ...labels.map(l => ({ value: l.id, label: l.name })),
  ];

  const clearAllFilters = () => {
    onFilterPriorityChange(null);
    onFilterDueDateChange('');
    onFilterAssigneeChange('');
    onFilterLabelChange('');
  };

  const filterCount = [filterPriority, filterDueDate, filterAssignee, filterLabel].filter(Boolean).length;

  return (
    <header className="board-header flex-shrink-0 relative z-10">
      <div className="flex items-center px-4 xl:px-6 py-3 xl:py-4 gap-2.5">
        {/* Logo + title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="Taskly" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-text tracking-tight font-heading hidden sm:block">Taskly</span>
        </div>

        {/* Search — always visible, flexible width */}
        <div className="relative flex-1 min-w-[120px] max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className={`w-full h-10 pl-9 ${searchQuery ? 'pr-9' : 'pr-3'} bg-bg-surface border border-border rounded-lg text-sm text-text placeholder-text-placeholder focus:outline-none focus:border-accent transition-all`}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-text-tertiary" />
            </button>
          )}
        </div>

        {/* Inline filters — only on xl+ (1280px) */}
        <div className="hidden xl:contents">
          <div className="h-5 w-px bg-border flex-shrink-0" />

          <CustomSelect
            value={filterPriority || ''}
            onChange={v => onFilterPriorityChange((v as TaskPriority) || null)}
            options={[
              { value: '', label: 'Priority' },
              { value: 'high', label: 'High' },
              { value: 'normal', label: 'Normal' },
              { value: 'low', label: 'Low' },
            ]}
            className="w-[100px] flex-shrink-0"
          />
          <CustomSelect
            value={filterDueDate}
            onChange={v => onFilterDueDateChange(v as DueDateFilter)}
            options={[
              { value: '', label: 'Due date' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'today', label: 'Due today' },
              { value: 'this_week', label: 'This week' },
              { value: 'no_date', label: 'No date' },
            ]}
            className="w-[100px] flex-shrink-0"
          />
          {members.length > 0 && (
            <CustomSelect
              value={filterAssignee}
              onChange={v => onFilterAssigneeChange(v)}
              options={memberOptions}
              className="w-[100px] flex-shrink-0"
            />
          )}
          {labels.length > 0 && (
            <CustomSelect
              value={filterLabel}
              onChange={v => onFilterLabelChange(v)}
              options={labelOptions}
              className="w-[100px] flex-shrink-0"
            />
          )}

          <div className="h-5 w-px bg-border flex-shrink-0" />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-placeholder" />
            <CustomSelect
              value={sortBy}
              onChange={v => onSortChange(v as SortOption)}
              options={[
                { value: 'priority', label: 'Priority' },
                { value: 'due_date', label: 'Due date' },
              ]}
              className="w-[100px]"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="h-10 px-3 text-sm text-text-tertiary hover:text-text transition-colors flex-shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Collapsible filter toggle (< xl) */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`h-10 w-10 flex items-center justify-center bg-bg-surface border border-border rounded-lg transition-all xl:hidden relative ${
              filtersOpen ? 'text-accent border-accent/30' : 'text-text-secondary hover:text-text hover:border-border-hover'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {filterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
          <button onClick={onOpenStats} className="h-10 w-10 flex items-center justify-center bg-bg-surface border border-border rounded-lg text-text-secondary hover:text-text hover:border-border-hover transition-all hidden xl:flex">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button onClick={onManageTeam} className="h-10 w-10 flex items-center justify-center bg-bg-surface border border-border rounded-lg text-text-secondary hover:text-text hover:border-border-hover transition-all hidden xl:flex">
            <Users className="w-4 h-4" />
          </button>
          <button onClick={onManageLabels} className="h-10 w-10 flex items-center justify-center bg-bg-surface border border-border rounded-lg text-text-secondary hover:text-text hover:border-border-hover transition-all hidden xl:flex">
            <Tags className="w-4 h-4" />
          </button>
          <ThemePicker />
          <button
            onClick={onCreateTask}
            className="h-10 flex items-center gap-2 px-4 bg-accent hover:bg-accent-hover rounded-lg text-sm font-medium text-white transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* Collapsible filter/sort toolbar (< xl) */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="xl:hidden overflow-hidden"
          >
            <div className="border-t border-border px-4 sm:px-6 py-3 space-y-3">
              {/* Filters row */}
              <div className="flex flex-wrap gap-2">
                <CustomSelect
                  value={filterPriority || ''}
                  onChange={v => onFilterPriorityChange((v as TaskPriority) || null)}
                  options={[
                    { value: '', label: 'Priority' },
                    { value: 'high', label: 'High' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'low', label: 'Low' },
                  ]}
                  className="flex-1 min-w-[100px]"
                />
                <CustomSelect
                  value={filterDueDate}
                  onChange={v => onFilterDueDateChange(v as DueDateFilter)}
                  options={[
                    { value: '', label: 'Due date' },
                    { value: 'overdue', label: 'Overdue' },
                    { value: 'today', label: 'Due today' },
                    { value: 'this_week', label: 'This week' },
                    { value: 'no_date', label: 'No date' },
                  ]}
                  className="flex-1 min-w-[100px]"
                />
                {members.length > 0 && (
                  <CustomSelect
                    value={filterAssignee}
                    onChange={v => onFilterAssigneeChange(v)}
                    options={memberOptions}
                    className="flex-1 min-w-[100px]"
                  />
                )}
                {labels.length > 0 && (
                  <CustomSelect
                    value={filterLabel}
                    onChange={v => onFilterLabelChange(v)}
                    options={labelOptions}
                    className="flex-1 min-w-[100px]"
                  />
                )}
              </div>

              {/* Sort + management row */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-text-placeholder flex-shrink-0" />
                  <CustomSelect
                    value={sortBy}
                    onChange={v => onSortChange(v as SortOption)}
                    options={[
                      { value: 'priority', label: 'Priority' },
                      { value: 'due_date', label: 'Due date' },
                    ]}
                    className="w-[100px]"
                  />
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-1.5">
                  <button onClick={onOpenStats} className="h-9 w-9 flex items-center justify-center bg-bg-surface border border-border rounded-lg text-text-secondary hover:text-text transition-all">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onManageTeam} className="h-9 w-9 flex items-center justify-center bg-bg-surface border border-border rounded-lg text-text-secondary hover:text-text transition-all">
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onManageLabels} className="h-9 w-9 flex items-center justify-center bg-bg-surface border border-border rounded-lg text-text-secondary hover:text-text transition-all">
                    <Tags className="w-3.5 h-3.5" />
                  </button>
                </div>

                {hasFilters && (
                  <>
                    <div className="h-5 w-px bg-border" />
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-text-tertiary hover:text-text transition-colors whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
