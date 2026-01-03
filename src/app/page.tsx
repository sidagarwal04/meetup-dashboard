'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Network,
  CalendarDays,
} from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { ChartCard, ExpandedChartModal } from '@/components/ChartCard';
import { DataTable } from '@/components/DataTable';
import { FilterPanel } from '@/components/FilterPanel';
import { GroupData, EventData, OverallStats } from '@/types';
import {
  fetchGroupsData,
  fetchEventsData,
  calculateOverallStats,
  getRegionFromCity,
  fetchConsolidatedStats,
  getAvailableYears,
} from '@/lib/sheetsService';
import { format, parseISO } from 'date-fns';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [consolidatedStats, setConsolidatedStats] = useState<{
    [key: string]: { totalEvents: number; physicalEvents: number; onlineEvents: number; totalRSVPs: number };
  } | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Filter states
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Expanded chart state
  const [expandedChart, setExpandedChart] = useState<'members' | 'rsvps' | null>(null);

  // Auto-select groups when regions change
  useEffect(() => {
    if (selectedRegions.length > 0) {
      // Select all groups in the selected regions
      const groupsInSelectedRegions = groups
        .filter(g => g.region && selectedRegions.includes(g.region))
        .map(g => g.userGroupName);
      setSelectedGroups(groupsInSelectedRegions);
    } else if (!searchTerm) {
      // Clear group selection when no regions are selected and no search term
      setSelectedGroups([]);
    }
  }, [selectedRegions, groups, searchTerm]);

  // Auto-select groups when search term changes
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchingGroups = groups
        .filter(g => 
          g.userGroupName.toLowerCase().includes(term) ||
          g.city.toLowerCase().includes(term)
        )
        .map(g => g.userGroupName);
      setSelectedGroups(matchingGroups);
    } else if (selectedRegions.length === 0) {
      // Clear group selection only if no regions are selected
      setSelectedGroups([]);
    }
  }, [searchTerm, groups, selectedRegions]);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsData, eventsData, consolidatedData, years] = await Promise.all([
        fetchGroupsData(),
        fetchEventsData(),
        fetchConsolidatedStats(),
        getAvailableYears(),
      ]);

      setGroups(groupsData);
      setEvents(eventsData);
      setStats(calculateOverallStats(groupsData, eventsData));
      setConsolidatedStats(consolidatedData);
      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Extract unique values for filters
  const availableRegions = useMemo(() => {
    const regions = new Set(groups.map((g) => g.region || getRegionFromCity(g.city)));
    return Array.from(regions).filter((r) => r !== 'Unknown').sort();
  }, [groups]);

  const availableGroups = useMemo(() => {
    return Array.from(new Set(groups.map((g) => g.userGroupName))).sort();
  }, [groups]);

  const availableEventTypes = ['Physical', 'Online', 'Hybrid'];

  // Filter data
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      // Region filter
      if (selectedRegions.length > 0) {
        const region = group.region || getRegionFromCity(group.city);
        if (!selectedRegions.includes(region)) return false;
      }

      // Group filter
      if (selectedGroups.length > 0) {
        if (!selectedGroups.includes(group.userGroupName)) return false;
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          group.userGroupName.toLowerCase().includes(term) ||
          group.city.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [groups, selectedRegions, selectedGroups, searchTerm]);

  const filteredEvents = useMemo(() => {
    console.log('Filtering events. Total events:', events.length);
    console.log('Selected regions:', selectedRegions);
    console.log('Selected event types:', selectedEventTypes);
    console.log('Total groups:', groups.length);
    
    if (events.length > 0 && groups.length > 0) {
      console.log('Sample event:', {
        groupName: events[0]?.meetupGroupName,
        city: events[0]?.meetupCity,
        type: events[0]?.meetupType,
        typeRaw: events[0]?.meetupType
      });
      console.log('Sample group:', {
        name: groups[0]?.userGroupName,
        city: groups[0]?.city,
        region: groups[0]?.region
      });
      // Check event types in data
      const eventTypes = new Set(events.slice(0, 10).map(e => e.meetupType));
      console.log('Event types in first 10 events:', Array.from(eventTypes));
    }
    
    const filtered = events.filter((event) => {
      // Event type filter
      if (selectedEventTypes.length > 0) {
        if (!selectedEventTypes.includes(event.meetupType)) {
          return false;
        }
      }

      // Group filter
      if (selectedGroups.length > 0) {
        if (!selectedGroups.includes(event.meetupGroupName)) return false;
      }

      // Region filter - match event with group and use group's region
      if (selectedRegions.length > 0) {
        // Find the group for this event
        const group = groups.find(g => 
          g.userGroupName === event.meetupGroupName || 
          g.city.toLowerCase() === event.meetupCity.toLowerCase()
        );
        
        if (group && group.region) {
          const matched = selectedRegions.includes(group.region);
          if (!matched) return false;
        } else {
          // Fallback to city-based region detection
          const region = getRegionFromCity(event.meetupCity);
          if (!selectedRegions.includes(region)) return false;
        }
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          event.meetupTitle.toLowerCase().includes(term) ||
          event.meetupGroupName.toLowerCase().includes(term) ||
          event.meetupCity.toLowerCase().includes(term)
        );
      }

      return true;
    });
    
    console.log('Filtered events count:', filtered.length);
    if (selectedEventTypes.length > 0 && filtered.length > 0) {
      console.log('Sample filtered event type:', filtered[0]?.meetupType);
    }
    return filtered;
  }, [events, selectedEventTypes, selectedGroups, selectedRegions, searchTerm, groups]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    if (!stats) return null;
    return calculateOverallStats(filteredGroups, filteredEvents);
  }, [filteredGroups, filteredEvents, stats]);

  // Calculate filtered year-specific stats
  const filteredYearStats = useMemo(() => {
    // If no filters are applied, use consolidated stats from sheets
    const hasFilters = selectedRegions.length > 0 || selectedGroups.length > 0 || selectedEventTypes.length > 0 || searchTerm.length > 0;
    
    if (!hasFilters && consolidatedStats) {
      console.log('Using consolidated stats (no filters)');
      return consolidatedStats;
    }

    // Otherwise calculate from filtered events
    console.log('=== FILTERING YEAR STATS ===');
    console.log('Total events:', events.length);
    console.log('Total groups:', groups.length);
    console.log('Selected regions:', selectedRegions);
    
    if (events.length > 0) {
      console.log('Sample event group name:', events[0]?.meetupGroupName);
      console.log('Sample event year:', events[0]?.year);
      console.log('First 5 event years:', events.slice(0, 5).map(e => e.year));
    }
    if (groups.length > 0) {
      console.log('Sample group name:', groups[0]?.userGroupName);
      console.log('First 3 group names:', groups.slice(0, 3).map(g => g.userGroupName));
    }
    
    // For each event, map to its group and then to region
    const eventsWithRegion = events.map(event => {
      // Try to find the group by matching:
      // 1. Exact group name match
      // 2. By city (case-insensitive)
      // 3. By partial group name match (removing "Graph Database" prefix)
      // 4. By checking if city appears in group name
      
      let group = groups.find(g => g.userGroupName === event.meetupGroupName);
      
      if (!group && event.meetupCity) {
        // Try matching by city - exact match
        group = groups.find(g => 
          g.city.toLowerCase() === event.meetupCity.toLowerCase()
        );
      }
      
      if (!group && event.meetupCity) {
        // Try matching by city - partial match (e.g., "Tel Aviv-Yafo" contains "Tel Aviv")
        const eventCityLower = event.meetupCity.toLowerCase();
        group = groups.find(g => {
          const groupCityLower = g.city.toLowerCase();
          return groupCityLower.includes(eventCityLower) || eventCityLower.includes(groupCityLower);
        });
      }
      
      if (!group && event.meetupGroupName) {
        // Try fuzzy match - remove "Graph Database" and compare
        const eventLocation = event.meetupGroupName
          .replace(/^Graph Database\s*/i, '')
          .replace(/^-\s*/, '')
          .trim()
          .toLowerCase();
        
        group = groups.find(g => {
          const groupLocation = g.userGroupName
            .replace(/^Graph Database\s*/i, '')
            .replace(/^-\s*/, '')
            .trim()
            .toLowerCase();
          return groupLocation === eventLocation || groupLocation.includes(eventLocation) || eventLocation.includes(groupLocation);
        });
      }
      
      if (!group && event.meetupCity && event.meetupGroupName) {
        // Last resort: check if group name contains the city or vice versa
        const cityLower = event.meetupCity.toLowerCase();
        group = groups.find(g => {
          const groupNameLower = g.userGroupName.toLowerCase();
          return groupNameLower.includes(cityLower);
        });
      }
      
      if (!group && event.meetupGroupName) {
        console.log('No group found for:', event.meetupGroupName, 'City:', event.meetupCity);
      }
      
      // If no group found, use city-based region detection as fallback
      const region = group?.region || (event.meetupCity ? getRegionFromCity(event.meetupCity) : null);
      
      return {
        ...event,
        region: region !== 'Unknown' ? region : null,
        foundGroup: !!group
      };
    });
    
    const eventsWithoutRegion = eventsWithRegion.filter(e => !e.region);
    console.log('Events without region:', eventsWithoutRegion.length);
    console.log('Events with region:', eventsWithRegion.filter(e => e.region).length);
    
    if (eventsWithoutRegion.length > 0) {
      // Group unmatched events by group name to see patterns
      const unmatchedGroups = new Set(eventsWithoutRegion.map(e => e.meetupGroupName));
      console.log('Unmatched group names:', Array.from(unmatchedGroups));
      console.log('Sample unmatched events:', eventsWithoutRegion.slice(0, 3).map(e => ({
        group: e.meetupGroupName,
        city: e.meetupCity
      })));
    }
    
    if (eventsWithRegion.length > 0) {
      const sample = eventsWithRegion.find(e => e.region);
      console.log('Sample event with region:', {
        groupName: sample?.meetupGroupName,
        region: sample?.region,
        foundGroup: sample?.foundGroup
      });
    }
    
    // Filter events based on selected regions
    let filteredEventsForStats = eventsWithRegion;
    if (selectedRegions.length > 0) {
      filteredEventsForStats = eventsWithRegion.filter(e => 
        e.region && selectedRegions.includes(e.region)
      );
      console.log('After region filter:', filteredEventsForStats.length);
    }
    if (selectedGroups.length > 0) {
      filteredEventsForStats = filteredEventsForStats.filter(e => 
        selectedGroups.includes(e.meetupGroupName)
      );
      console.log('After group filter:', filteredEventsForStats.length);
    }
    if (selectedEventTypes.length > 0) {
      filteredEventsForStats = filteredEventsForStats.filter(e => 
        selectedEventTypes.includes(e.meetupType)
      );
      console.log('After event type filter:', filteredEventsForStats.length);
    }
    
    console.log('Final filtered events for stats:', filteredEventsForStats.length);
    
    // Check what years we have
    if (filteredEventsForStats.length > 0) {
      console.log('Sample filtered event years:', filteredEventsForStats.slice(0, 5).map(e => e.year));
    }
    
    const isEventType = (event: any, type: string) => {
      const eventType = (event.meetupType || '').toLowerCase().trim();
      return eventType === type.toLowerCase();
    };

    // Dynamically calculate stats for all available years
    const stats: { [key: string]: { totalEvents: number; physicalEvents: number; onlineEvents: number; totalRSVPs: number } } = {};
    
    availableYears.forEach(year => {
      const eventsInYear = filteredEventsForStats.filter(e => e.year === year);
      stats[`stats${year}`] = {
        totalEvents: eventsInYear.length,
        physicalEvents: eventsInYear.filter(e => isEventType(e, 'Physical')).length,
        onlineEvents: eventsInYear.filter(e => isEventType(e, 'Online')).length,
        totalRSVPs: eventsInYear.reduce((sum, e) => sum + (e.rsvpCount || 0), 0),
      };
      console.log(`Events in ${year}:`, eventsInYear.length);
    });

    console.log('Calculated year stats:', stats);
    console.log('=== END FILTERING ===');
    return stats;
  }, [events, groups, consolidatedStats, selectedRegions, selectedGroups, selectedEventTypes, searchTerm, availableYears]);

  // Prepare chart data
  const membersByGroup = useMemo(() => {
    return filteredGroups
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 10)
      .map((g) => ({
        name: g.userGroupName.replace('Graph Database ', ''),
        members: g.memberCount,
      }));
  }, [filteredGroups]);

  const rsvpsByGroup = useMemo(() => {
    return filteredGroups
      .sort((a, b) => b.pastRSVPs - a.pastRSVPs)
      .slice(0, 10)
      .map((g) => ({
        name: g.userGroupName.replace('Graph Database ', ''),
        rsvps: g.pastRSVPs,
      }));
  }, [filteredGroups]);

  // Full data for expanded views
  const allMembersByGroup = useMemo(() => {
    return filteredGroups
      .sort((a, b) => b.memberCount - a.memberCount)
      .map((g) => ({
        name: g.userGroupName.replace('Graph Database ', ''),
        members: g.memberCount,
      }));
  }, [filteredGroups]);

  const allRsvpsByGroup = useMemo(() => {
    return filteredGroups
      .sort((a, b) => b.pastRSVPs - a.pastRSVPs)
      .map((g) => ({
        name: g.userGroupName.replace('Graph Database ', ''),
        rsvps: g.pastRSVPs,
      }));
  }, [filteredGroups]);

  const handleClearFilters = () => {
    setSelectedRegions([]);
    setSelectedGroups([]);
    setSelectedEventTypes([]);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meetup Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track your Meetup groups and events performance
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterPanel
              regions={availableRegions}
              groups={availableGroups}
              eventTypes={availableEventTypes}
              selectedRegions={selectedRegions}
              selectedGroups={selectedGroups}
              selectedEventTypes={selectedEventTypes}
              searchTerm={searchTerm}
              onRegionChange={setSelectedRegions}
              onGroupChange={setSelectedGroups}
              onEventTypeChange={setSelectedEventTypes}
              onSearchChange={setSearchTerm}
              onClearFilters={handleClearFilters}
              groupsData={groups}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <KPICard
                title="Total Groups"
                value={filteredStats?.totalGroups || 0}
                icon={<Network className="w-5 h-5" />}
                loading={loading}
              />
              <KPICard
                title="Total Members"
                value={filteredStats?.totalMembers || 0}
                icon={<Users className="w-5 h-5" />}
                loading={loading}
              />
              <KPICard
                title="Past Events"
                value={filteredStats?.totalPastEvents || 0}
                icon={<Calendar className="w-5 h-5" />}
                loading={loading}
              />
              <KPICard
                title="Upcoming Events"
                value={filteredStats?.totalUpcomingEvents || 0}
                icon={<CalendarDays className="w-5 h-5" />}
                loading={loading}
              />
              <KPICard
                title="Total RSVPs"
                value={filteredStats?.totalPastRSVPs || 0}
                icon={<CheckCircle className="w-5 h-5" />}
                loading={loading}
              />
            </div>

            {/* Dynamic Year Stats with YoY Growth (Descending Order) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableYears.map((year, index) => {
                const currentYearStats = filteredYearStats?.[`stats${year}`];
                const prevYear = availableYears[index + 1];
                const prevYearStats = prevYear ? filteredYearStats?.[`stats${prevYear}`] : null;
                
                // Calculate YoY growth if previous year exists
                const yoyGrowth = prevYearStats && prevYearStats.totalEvents > 0
                  ? ((currentYearStats.totalEvents - prevYearStats.totalEvents) / prevYearStats.totalEvents * 100)
                  : null;

                return (
                  <div key={year} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {year} Statistics
                      </h3>
                      {yoyGrowth !== null && (
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          yoyGrowth >= 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {yoyGrowth.toFixed(1)}% YoY
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Events:</span>
                        <span className="font-semibold">
                          {currentYearStats?.totalEvents || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Physical Events:</span>
                        <span className="font-semibold">
                          {currentYearStats?.physicalEvents || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Online Events:</span>
                        <span className="font-semibold">
                          {currentYearStats?.onlineEvents || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total RSVPs:</span>
                        <span className="font-semibold">
                          {currentYearStats?.totalRSVPs?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Top 10 Groups by Members"
                data={membersByGroup}
                type="bar"
                dataKey="members"
                xAxisKey="name"
                color="#8b5cf6"
                loading={loading}
                onExpand={() => setExpandedChart('members')}
              />
              <ChartCard
                title="Top 10 Groups by RSVPs"
                data={rsvpsByGroup}
                type="bar"
                dataKey="rsvps"
                xAxisKey="name"
                color="#06b6d4"
                loading={loading}
                onExpand={() => setExpandedChart('rsvps')}
              />
            </div>

            {/* Expanded Chart Modals */}
            {expandedChart === 'members' && (
              <ExpandedChartModal
                title="All Groups by Members"
                data={allMembersByGroup}
                type="bar"
                dataKey="members"
                xAxisKey="name"
                color="#8b5cf6"
                onClose={() => setExpandedChart(null)}
              />
            )}
            {expandedChart === 'rsvps' && (
              <ExpandedChartModal
                title="All Groups by RSVPs"
                data={allRsvpsByGroup}
                type="bar"
                dataKey="rsvps"
                xAxisKey="name"
                color="#06b6d4"
                onClose={() => setExpandedChart(null)}
              />
            )}

            {/* Groups Table */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Groups Overview
              </h2>
              <DataTable
                columns={[
                  {
                    key: 'userGroupName',
                    label: 'Group Name',
                    sortable: true,
                  },
                  {
                    key: 'city',
                    label: 'City',
                    sortable: true,
                  },
                  {
                    key: 'memberCount',
                    label: 'Members',
                    sortable: true,
                    render: (val) => val.toLocaleString(),
                  },
                  {
                    key: 'pastRSVPs',
                    label: 'Past RSVPs',
                    sortable: true,
                    render: (val) => val.toLocaleString(),
                  },
                  {
                    key: 'pastEventCount',
                    label: 'Past Events',
                    sortable: true,
                  },
                  {
                    key: 'upcomingEvents',
                    label: 'Upcoming',
                    sortable: true,
                  },
                ]}
                data={[...filteredGroups].sort((a, b) => b.memberCount - a.memberCount)}
                loading={loading}
                pageSize={10}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
