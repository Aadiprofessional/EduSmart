import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTimes, FaSearch, FaChevronDown, FaSort } from 'react-icons/fa';
import IconComponent from './IconComponent';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MobileFilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  sortOptions?: Array<{
    value: string;
    label: string;
  }>;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
  className?: string;
  dark?: boolean;
}

const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  sortOptions = [],
  sortBy = '',
  onSortChange,
  onClearFilters,
  activeFilterCount = 0,
  className = '',
  dark = false
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const handleFilterToggle = (filterKey: string) => {
    setExpandedFilter(expandedFilter === filterKey ? null : filterKey);
  };

  const bgClass = dark ? 'bg-[#0A0A0A]' : 'bg-white';
  const borderClass = dark ? 'border-white/10' : 'border-gray-200';
  const textClass = dark ? 'text-white' : 'text-gray-900';
  const textMutedClass = dark ? 'text-gray-400' : 'text-gray-500';
  const inputBgClass = dark ? 'bg-white/5' : 'bg-gray-50';
  const inputBorderClass = dark ? 'border-white/10' : 'border-gray-200';
  const hoverBgClass = dark ? 'hover:bg-white/5' : 'hover:bg-gray-200';
  const activeBgClass = dark ? 'bg-white/10' : 'bg-gray-100';

  return (
    <div className={`${bgClass} rounded-xl shadow-sm border ${borderClass} ${className}`}>
      {/* Search Bar */}
      <div className={`p-4 border-b ${dark ? 'border-white/10' : 'border-gray-100'}`}>
        <div className="relative">
          <IconComponent 
            icon={FaSearch} 
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMutedClass} h-4 w-4`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full pl-10 pr-4 py-3 border ${inputBorderClass} rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 text-sm ${inputBgClass} ${textClass} placeholder-gray-500`}
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 space-y-3">
        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 ${activeBgClass} rounded-lg ${hoverBgClass} transition-all duration-200 flex-1`}
          >
            <IconComponent icon={FaFilter} className={`h-4 w-4 ${dark ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
          </button>

          {/* Sort Dropdown */}
          {sortOptions.length > 0 && onSortChange && (
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className={`appearance-none ${activeBgClass} border-0 rounded-lg px-3 py-2 pr-8 text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'} ${hoverBgClass} transition-all duration-200 cursor-pointer`}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className={dark ? 'bg-[#0A0A0A] text-white' : ''}>
                    {option.label}
                  </option>
                ))}
              </select>
              <IconComponent 
                icon={FaChevronDown} 
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 ${textMutedClass} pointer-events-none`}
              />
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && onClearFilters && (
          <button
            onClick={onClearFilters}
            className={`w-full py-2 text-sm ${dark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} font-medium transition-colors duration-200`}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`border-t ${dark ? 'border-white/10' : 'border-gray-100'} overflow-hidden`}
          >
            <div className="p-4 space-y-3">
              {filters.map((filter) => (
                <div key={filter.key} className={`border ${dark ? 'border-white/10' : 'border-gray-200'} rounded-lg overflow-hidden`}>
                  <button
                    onClick={() => handleFilterToggle(filter.key)}
                    className={`w-full flex items-center justify-between p-3 ${dark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors duration-200`}
                  >
                    <span className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{filter.label}</span>
                    <motion.div
                      animate={{ rotate: expandedFilter === filter.key ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconComponent icon={FaChevronDown} className={`h-3 w-3 ${textMutedClass}`} />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {expandedFilter === filter.key && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-3 ${dark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-gray-100'} border-t max-h-48 overflow-y-auto`}>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={filter.key}
                                value=""
                                checked={filter.value === ""}
                                onChange={() => filter.onChange("")}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>All</span>
                            </label>
                            
                            {filter.options.map((option) => (
                              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={filter.key}
                                  value={option.value}
                                  checked={filter.value === option.value}
                                  onChange={() => filter.onChange(option.value)}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'} flex-1`}>{option.label}</span>
                                {option.count !== undefined && (
                                  <span className={`text-xs ${textMutedClass} ${dark ? 'bg-white/10' : 'bg-gray-100'} px-2 py-0.5 rounded-full`}>
                                    {option.count}
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileFilterPanel; 