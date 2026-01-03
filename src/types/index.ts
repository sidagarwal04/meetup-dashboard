// Data types based on your Google Sheets structure

export interface GroupData {
  timestamp: string;
  userGroupName: string;
  memberCount: number;
  proJoinDate: string;
  foundedDate: string;
  city: string;
  pastRSVPs: number;
  pastEventCount: number;
  upcomingEvents: number;
  lastEventDate: string;
  region?: 'AMER' | 'APAC' | 'EMEA';
}

export interface EventData {
  timestamp: string;
  meetupTitle: string;
  meetupURL: string;
  meetupDate: string;
  meetupGroupName: string;
  meetupCity: string;
  rsvpCount: number;
  meetupType: 'Physical' | 'Online' | 'Hybrid';
  year?: number;
}

export interface RegionalStats {
  region: 'AMER' | 'APAC' | 'EMEA';
  groupCount: number;
  memberCount: number;
  pastRSVPs: number;
  pastEvents: number;
  upcomingEvents: number;
  eventsFor2024: number;
  eventsFor2025: number;
  physicalEvents2024: number;
  physicalEvents2025: number;
  hybridEvents2024: number;
  hybridEvents2025: number;
  onlineEvents2024: number;
  onlineEvents2025: number;
  rsvpCount2024: number;
  rsvpCount2025: number;
}

export interface OverallStats {
  totalGroups: number;
  totalMembers: number;
  totalPastRSVPs: number;
  totalPastEvents: number;
  totalUpcomingEvents: number;
  totalEventsFor2024: number;
  totalEventsFor2025: number;
  physicalEvents2024: number;
  physicalEvents2025: number;
  hybridEvents2024: number;
  hybridEvents2025: number;
  onlineEvents2024: number;
  onlineEvents2025: number;
  totalRSVP2024: number;
  totalRSVP2025: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface DashboardFilters {
  region: string[];
  groups: string[];
  eventType: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchTerm: string;
}
