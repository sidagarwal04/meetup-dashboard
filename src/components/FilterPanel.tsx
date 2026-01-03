import React from 'react';
import { X } from 'lucide-react';

interface FilterPanelProps {
  regions: string[];
  groups: string[];
  eventTypes: string[];
  selectedRegions: string[];
  selectedGroups: string[];
  selectedEventTypes: string[];
  searchTerm: string;
  onRegionChange: (regions: string[]) => void;
  onGroupChange: (groups: string[]) => void;
  onEventTypeChange: (types: string[]) => void;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
  groupsData?: Array<{ userGroupName: string; region?: string }>;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  regions,
  groups,
  eventTypes,
  selectedRegions,
  selectedGroups,
  selectedEventTypes,
  searchTerm,
  onRegionChange,
  onGroupChange,
  onEventTypeChange,
  onSearchChange,
  onClearFilters,
  groupsData = [],
}) => {
  const hasActiveFilters =
    selectedRegions.length > 0 ||
    selectedGroups.length > 0 ||
    selectedEventTypes.length > 0 ||
    searchTerm.length > 0;

  // Filter groups based on selected regions
  const displayGroups = selectedRegions.length > 0
    ? groups.filter(groupName => {
        const group = groupsData.find(g => g.userGroupName === groupName);
        return group?.region && selectedRegions.includes(group.region);
      })
    : groups;

  // Sort groups: selected ones first, then alphabetically
  const sortedDisplayGroups = [...displayGroups].sort((a, b) => {
    const aSelected = selectedGroups.includes(a);
    const bSelected = selectedGroups.includes(b);
    
    // If selection status is different, selected comes first
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    
    // If both selected or both not selected, sort alphabetically
    return a.localeCompare(b);
  });

  const handleCheckboxChange = (
    value: string,
    selected: string[],
    onChange: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          placeholder="Search groups, cities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Regions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Regions
        </label>
        <div className="space-y-2">
          {regions.map((region) => (
            <label key={region} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRegions.includes(region)}
                onChange={() =>
                  handleCheckboxChange(region, selectedRegions, onRegionChange)
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{region}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Event Types */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Types
        </label>
        <div className="space-y-2">
          {eventTypes.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEventTypes.includes(type)}
                onChange={() =>
                  handleCheckboxChange(type, selectedEventTypes, onEventTypeChange)
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Groups - with search and max height */}
      {groups.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Groups ({selectedGroups.length} selected)
          </label>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
            {sortedDisplayGroups.map((group) => (
              <label key={group} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group)}
                  onChange={() =>
                    handleCheckboxChange(group, selectedGroups, onGroupChange)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className={`ml-2 text-sm ${selectedGroups.includes(group) ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{group}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
