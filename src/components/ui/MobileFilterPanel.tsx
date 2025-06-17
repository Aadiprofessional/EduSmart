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
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const handleFilterToggle = (filterKey: string) => {
    setExpandedFilter(expandedFilter === filterKey ? null : filterKey);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <IconComponent 
            icon={FaSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-4 space-y-3">
        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 flex-1"
          >
            <IconComponent icon={FaFilter} className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
          </button>

          {/* Sort Dropdown */}
          {sortOptions.length > 0 && onSortChange && (
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none bg-gray-100 border-0 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all duration-200 cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <IconComponent 
                icon={FaChevronDown} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" 
              />
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
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
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {filters.map((filter) => (
                <div key={filter.key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleFilterToggle(filter.key)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium text-gray-700">{filter.label}</span>
                    <motion.div
                      animate={{ rotate: expandedFilter === filter.key ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconComponent icon={FaChevronDown} className="h-3 w-3 text-gray-500" />
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
                        <div className="p-3 bg-white border-t border-gray-100 max-h-48 overflow-y-auto">
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={filter.key}
                                value=""
                                checked={filter.value === ""}
                                onChange={() => filter.onChange("")}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">All</span>
                            </label>
                            
                            {filter.options.map((option) => (
                              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={filter.key}
                                  value={option.value}
                                  checked={filter.value === option.value}
                                  onChange={() => filter.onChange(option.value)}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                                {option.count !== undefined && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
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