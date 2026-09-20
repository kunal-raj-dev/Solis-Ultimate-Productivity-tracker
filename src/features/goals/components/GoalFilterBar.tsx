import React from 'react';
import { Search, X } from 'lucide-react';
import { Goal, GoalHorizon, GoalExperienceType, GoalStatus } from '../../../types/goal';
import { CustomSelect } from '../../../components/ui/Select/CustomSelect';

export type SortOption = 'date_asc' | 'priority_desc' | 'progress_desc' | 'progress_asc' | 'title_asc';

export interface GoalFilterBarProps {
  goals: Goal[];
  selectedHorizon: GoalHorizon | 'all';
  onSelectHorizon: (h: GoalHorizon | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedExpType: GoalExperienceType | 'all';
  onSelectExpType: (exp: GoalExperienceType | 'all') => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: GoalStatus | 'all';
  onSelectStatus: (status: GoalStatus | 'all') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onResetFilters: () => void;
}

export const GoalFilterBar: React.FC<GoalFilterBarProps> = ({
  goals,
  selectedHorizon,
  onSelectHorizon,
  searchQuery,
  onSearchChange,
  selectedExpType,
  onSelectExpType,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  sortBy,
  onSortChange,
  onResetFilters
}) => {
  // Horizon counts based on selected status filter
  const statusFilteredGoals = selectedStatus === 'all'
    ? goals
    : goals.filter((g) => g.status === selectedStatus);

  const horizonCounts = {
    all: statusFilteredGoals.length,
    short_term: statusFilteredGoals.filter((g) => g.horizon === 'short_term').length,
    medium_term: statusFilteredGoals.filter((g) => g.horizon === 'medium_term').length,
    long_term: statusFilteredGoals.filter((g) => g.horizon === 'long_term').length,
    vision: statusFilteredGoals.filter((g) => g.horizon === 'vision').length
  };

  const isFiltered =
    selectedHorizon !== 'all' ||
    selectedExpType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'active' ||
    searchQuery.trim().length > 0;

  return (
    <div className="solis-goals-filter-wrapper">
      {/* 1. Primary Horizon Tab Navigation */}
      <div className="solis-goals-horizon-tabs" role="tablist" aria-label="Goal Horizon Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={selectedHorizon === 'all'}
          className={`solis-goals-horizon-tab ${selectedHorizon === 'all' ? 'solis-goals-horizon-tab--active' : ''}`}
          onClick={() => onSelectHorizon('all')}
        >
          <span>All Horizons</span>
          <span className="solis-goals-horizon-tab__count">{horizonCounts.all}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedHorizon === 'short_term'}
          className={`solis-goals-horizon-tab ${selectedHorizon === 'short_term' ? 'solis-goals-horizon-tab--active' : ''}`}
          onClick={() => onSelectHorizon('short_term')}
        >
          <span>Short-Term (1–3m)</span>
          <span className="solis-goals-horizon-tab__count">{horizonCounts.short_term}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedHorizon === 'medium_term'}
          className={`solis-goals-horizon-tab ${selectedHorizon === 'medium_term' ? 'solis-goals-horizon-tab--active' : ''}`}
          onClick={() => onSelectHorizon('medium_term')}
        >
          <span>Semester (Medium)</span>
          <span className="solis-goals-horizon-tab__count">{horizonCounts.medium_term}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedHorizon === 'long_term'}
          className={`solis-goals-horizon-tab ${selectedHorizon === 'long_term' ? 'solis-goals-horizon-tab--active' : ''}`}
          onClick={() => onSelectHorizon('long_term')}
        >
          <span>Long-Term (1–2y)</span>
          <span className="solis-goals-horizon-tab__count">{horizonCounts.long_term}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedHorizon === 'vision'}
          className={`solis-goals-horizon-tab ${selectedHorizon === 'vision' ? 'solis-goals-horizon-tab--active' : ''}`}
          onClick={() => onSelectHorizon('vision')}
        >
          <span>Life Vision</span>
          <span className="solis-goals-horizon-tab__count">{horizonCounts.vision}</span>
        </button>
      </div>

      {/* 2. Secondary Filter Controls Bar */}
      <div className="solis-goals-filter-controls">
        {/* Search */}
        <div className="solis-goals-search-field">
          <Search size={14} className="solis-goals-search-field__icon" />
          <input
            type="text"
            placeholder="Search goals, subjects, deliverables..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="solis-goals-search-field__input"
            aria-label="Search goals"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="solis-goals-search-field__clear"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="solis-goals-filter-dropdowns">
          <div className="solis-goals-select-sm">
            <CustomSelect
              label=""
              value={selectedExpType}
              onChange={(val) => onSelectExpType(val as any)}
              options={[
                { value: 'all', label: 'All Modes' },
                { value: 'standard', label: 'Standard Goals' },
                { value: 'exam', label: 'Exam Workspaces' },
                { value: 'project', label: 'Project Workspaces' }
              ]}
            />
          </div>

          <div className="solis-goals-select-sm">
            <CustomSelect
              label=""
              value={selectedCategory}
              onChange={onSelectCategory}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'academic', label: 'Academic' },
                { value: 'career', label: 'Career' },
                { value: 'skill', label: 'Cognitive Skill' },
                { value: 'personal', label: 'Personal Growth' }
              ]}
            />
          </div>

          <div className="solis-goals-select-sm">
            <CustomSelect
              label=""
              value={selectedStatus}
              onChange={(val) => onSelectStatus(val as any)}
              options={[
                { value: 'active', label: 'Status: Active' },
                { value: 'completed', label: 'Status: Completed' },
                { value: 'paused', label: 'Status: Paused' },
                { value: 'all', label: 'Status: All' }
              ]}
            />
          </div>

          <div className="solis-goals-select-sm">
            <CustomSelect
              label=""
              value={sortBy}
              onChange={(val) => onSortChange(val as any)}
              options={[
                { value: 'date_asc', label: 'Sort: Nearest Deadline' },
                { value: 'priority_desc', label: 'Sort: Highest Priority' },
                { value: 'progress_desc', label: 'Sort: Progress (High to Low)' },
                { value: 'progress_asc', label: 'Sort: Progress (Low to High)' },
                { value: 'title_asc', label: 'Sort: Alphabetical' }
              ]}
            />
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="solis-goals-reset-btn"
              title="Reset all filters"
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
