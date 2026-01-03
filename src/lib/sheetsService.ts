import { GroupData, EventData, RegionalStats, OverallStats } from '@/types';

const GOOGLE_SHEETS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID;

interface SheetConfig {
  spreadsheetId: string;
  range: string;
}

/**
 * Fetch spreadsheet metadata to get list of available sheets
 */
async function fetchSpreadsheetMetadata(spreadsheetId: string): Promise<string[]> {
  if (!GOOGLE_SHEETS_API_KEY) {
    console.error('Google Sheets API key not configured');
    return [];
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${GOOGLE_SHEETS_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch spreadsheet metadata: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const sheetNames = data.sheets?.map((sheet: any) => sheet.properties.title) || [];
    console.log('Available sheets:', sheetNames);
    return sheetNames;
  } catch (error) {
    console.error('Error fetching spreadsheet metadata:', error);
    return [];
  }
}

/**
 * Get available years based on existing Events sheets
 */
export async function getAvailableYears(): Promise<number[]> {
  if (!SPREADSHEET_ID) return [];
  
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 20;
  
  // Get all sheet names
  const sheetNames = await fetchSpreadsheetMetadata(SPREADSHEET_ID);
  
  // Find sheets that match "Events YYYY" pattern
  const years: number[] = [];
  for (let year = currentYear; year >= startYear; year--) {
    const sheetName = `Events ${year}`;
    if (sheetNames.includes(sheetName)) {
      years.push(year);
    }
  }
  
  console.log('Available years:', years);
  return years;
}

/**
 * Fetch data from Google Sheets using the Sheets API v4
 */
async function fetchSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
  if (!GOOGLE_SHEETS_API_KEY) {
    console.error('Google Sheets API key not configured');
    return [];
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;
    console.log(`Fetching: ${range}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Success: Got ${data.values?.length || 0} rows from ${range}`);
    return data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}

/**
 * Convert sheet rows to typed objects
 */
function rowsToObjects<T>(rows: any[][], headers?: string[]): T[] {
  if (rows.length === 0) return [];
  
  const headerRow = headers || rows[0];
  const dataRows = headers ? rows : rows.slice(1);
  
  return dataRows.map(row => {
    const obj: any = {};
    headerRow.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}

/**
 * Fetch Groups data from Google Sheets (from multiple tabs)
 */
export async function fetchGroupsData(): Promise<GroupData[]> {
  if (!SPREADSHEET_ID) {
    console.error('Spreadsheet ID not configured');
    return [];
  }

  const groupsSheets = process.env.NEXT_PUBLIC_GROUPS_SHEETS || 'AMER Dashboard,EMEA Dashboard,APAC Dashboard';
  const sheetNames = groupsSheets.replace(/"/g, '').split(',').map(s => s.trim());
  
  console.log('Fetching groups from sheets:', sheetNames);
  
  let allGroups: GroupData[] = [];
  
  for (const sheetName of sheetNames) {
    console.log(`Fetching from sheet: ${sheetName}`);
    const rows = await fetchSheetData(SPREADSHEET_ID, `${sheetName}!A:J`);
    console.log(`Fetched ${rows.length} rows from ${sheetName}`);
    
    // Determine region from sheet name
    let region: 'AMER' | 'APAC' | 'EMEA' = 'AMER';
    if (sheetName.toUpperCase().includes('EMEA')) region = 'EMEA';
    else if (sheetName.toUpperCase().includes('APAC')) region = 'APAC';
    else if (sheetName.toUpperCase().includes('AMER')) region = 'AMER';
    
    // Log first few rows to see actual data structure
    if (rows.length > 0) {
      console.log(`First row (headers) from ${sheetName}:`, rows[0]);
      if (rows.length > 1) {
        console.log(`Second row (data sample) from ${sheetName}:`, rows[1]);
      }
    }
    
    // Use actual headers from sheet (first row)
    const groups = rowsToObjects<any>(rows).map(row => {
      // Map the actual column names to our expected field names
      const upcomingEvents = parseInt(row['Upcoming Events Count'] || row['Upcoming Event'] || row['Upcoming Events'] || row['upcomingEvents'] || '0');
      
      const group: GroupData = {
        timestamp: row['Timestamp'] || row['timestamp'] || '',
        userGroupName: row['User Group Name'] || row['userGroupName'] || '',
        memberCount: parseInt(row['Member Count'] || row['memberCount'] || '0'),
        proJoinDate: row['Pro Join Date'] || row['proJoinDate'] || '',
        foundedDate: row['Founded Date'] || row['foundedDate'] || '',
        city: row['City'] || row['city'] || '',
        pastRSVPs: parseInt(row['Past RSVPs'] || row['pastRSVPs'] || '0'),
        pastEventCount: parseInt(row['Past Event Count'] || row['pastEventCount'] || '0'),
        upcomingEvents: upcomingEvents,
        lastEventDate: row['Last Event Date'] || row['lastEventDate'] || '',
        region: region,
      };
      
      // Debug log for upcoming events
      if (upcomingEvents > 0) {
        console.log(`Group ${group.userGroupName} has ${upcomingEvents} upcoming events`);
      }
      
      return group;
    });
    
    // Log sample parsed data
    if (groups.length > 0) {
      console.log(`Sample parsed group from ${sheetName}:`, groups[0]);
    }
    console.log(`Parsed ${groups.length} groups from ${sheetName} (${region})`);
    allGroups = [...allGroups, ...groups];
  }
  
  console.log(`Total groups fetched: ${allGroups.length}`);
  return allGroups;
}

/**
 * Fetch Events data from Google Sheets (from multiple tabs)
 */
export async function fetchEventsData(): Promise<EventData[]> {
  if (!SPREADSHEET_ID) {
    console.error('Spreadsheet ID not configured');
    return [];
  }

  // Get available years dynamically
  const availableYears = await getAvailableYears();
  if (availableYears.length === 0) {
    console.log('No Events sheets found');
    return [];
  }
  
  const sheetNames = availableYears.map(year => `Events ${year}`);
  console.log('Fetching events from sheets:', sheetNames);
  
  let allEvents: EventData[] = [];
  
  for (const sheetName of sheetNames) {
    console.log(`Fetching from sheet: ${sheetName}`);
    const rows = await fetchSheetData(SPREADSHEET_ID, `${sheetName}!A:H`);
    console.log(`Fetched ${rows.length} rows from ${sheetName}`);
    
    // Extract year from sheet name
    const yearMatch = sheetName.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
    console.log(`Sheet "${sheetName}" - Year match: ${yearMatch}, Assigned year: ${year}`);
    
    // Log first few rows to see actual data structure
    if (rows.length > 0) {
      console.log(`First row (headers) from ${sheetName}:`, rows[0]);
      if (rows.length > 1) {
        console.log(`Second row (data sample) from ${sheetName}:`, rows[1]);
      }
    }
    
    // Use actual headers from sheet (first row)
    const events = rowsToObjects<any>(rows).map(row => {
      // Map the actual column names to our expected field names
      const rawType = row['Meetup Type'] || row['meetupType'] || '';
      // Normalize meetup type to proper case
      let normalizedType = rawType.trim();
      if (normalizedType.toUpperCase() === 'ONLINE') normalizedType = 'Online';
      else if (normalizedType.toUpperCase() === 'PHYSICAL') normalizedType = 'Physical';
      else if (normalizedType.toUpperCase() === 'HYBRID') normalizedType = 'Hybrid';
      
      const event: EventData = {
        timestamp: row['Timestamp'] || row['timestamp'] || '',
        meetupTitle: row['Meetup Title'] || row['meetupTitle'] || '',
        meetupURL: row['Meetup URL'] || row['meetupURL'] || '',
        meetupDate: row['Meetup Date'] || row['meetupDate'] || '',
        meetupGroupName: row['Meetup Group Name'] || row['meetupGroupName'] || '',
        meetupCity: row['Meetup City'] || row['meetupCity'] || '',
        rsvpCount: parseInt(row['RSVP Count'] || row['rsvpCount'] || '0'),
        meetupType: normalizedType as 'Physical' | 'Online' | 'Hybrid',
        year: year,
      };
      return event;
    });
    
    // Log sample parsed data
    if (events.length > 0) {
      console.log(`Sample parsed event from ${sheetName}:`, events[0]);
      console.log(`Sample event year field:`, events[0].year);
    }
    console.log(`Parsed ${events.length} events from ${sheetName} (year: ${year})`);
    allEvents = [...allEvents, ...events];
  }
  
  console.log(`Total events fetched: ${allEvents.length}`);
  return allEvents;
}

/**
 * Fetch Regional Statistics from Google Sheets
 */
export async function fetchRegionalStats(): Promise<RegionalStats[]> {
  if (!SPREADSHEET_ID) return [];

  const summarySheet = process.env.NEXT_PUBLIC_SUMMARY_SHEET || 'Consolidated Dashboard';
  const rows = await fetchSheetData(SPREADSHEET_ID, `${summarySheet}!A:Z`);
  
  // Parse the regional data based on your summary sheet structure
  const regions: RegionalStats[] = [];
  
  // You'll need to adjust this based on your exact sheet structure
  // This is a template that you can modify
  
  return regions;
}

/**
 * Fetch consolidated stats from Events sheets for all available years
 */
export async function fetchConsolidatedStats(): Promise<{
  [key: string]: { totalEvents: number; physicalEvents: number; onlineEvents: number; totalRSVPs: number };
} | null> {
  if (!SPREADSHEET_ID) return null;

  // Get available years
  const availableYears = await getAvailableYears();
  if (availableYears.length === 0) {
    console.log('No Events sheets found');
    return null;
  }
  
  console.log('Fetching consolidated stats from Events sheets for years:', availableYears);
  
  // Fetch data from all available years in parallel
  const fetchPromises = availableYears.map(year => 
    fetchSheetData(SPREADSHEET_ID!, `Events ${year}!A:H`)
  );
  
  const allRows = await Promise.all(fetchPromises);
  
  // Process each year's data
  const stats: { [key: string]: { totalEvents: number; physicalEvents: number; onlineEvents: number; totalRSVPs: number } } = {};
  
  availableYears.forEach((year, index) => {
    const rows = allRows[index];
    console.log(`Fetched ${rows.length} rows from Events ${year}`);
    
    // Parse events
    const events = rowsToObjects<any>(rows).map(row => ({
      meetupType: (row['Meetup Type'] || row['meetupType'] || '').toLowerCase().trim(),
      rsvpCount: parseInt(row['RSVP Count'] || row['rsvpCount'] || '0'),
      meetupGroupName: row['Meetup Group Name'] || row['meetupGroupName'] || '',
      meetupCity: row['Meetup City'] || row['meetupCity'] || '',
    }));
    
    console.log(`Parsed ${events.length} events from ${year}`);
    
    // Calculate stats for this year
    stats[`stats${year}`] = {
      totalEvents: events.length,
      physicalEvents: events.filter(e => e.meetupType === 'physical').length,
      onlineEvents: events.filter(e => e.meetupType === 'online').length,
      totalRSVPs: events.reduce((sum, e) => sum + (e.rsvpCount || 0), 0),
    };
    
    console.log(`Consolidated stats ${year}:`, stats[`stats${year}`]);
  });

  return stats;
}

/**
 * Calculate overall statistics from groups and events data
 */
export function calculateOverallStats(
  groups: GroupData[],
  events: EventData[]
): OverallStats {
  const eventsIn2024 = events.filter(e => {
    const dateStr = e.meetupDate?.toString() || '';
    return dateStr.includes('2024');
  });
  
  const eventsIn2025 = events.filter(e => {
    const dateStr = e.meetupDate?.toString() || '';
    return dateStr.includes('2025');
  });

  // Helper to normalize event type for case-insensitive comparison
  const isEventType = (event: EventData, type: string) => {
    const eventType = (event.meetupType || '').toLowerCase().trim();
    return eventType === type.toLowerCase();
  };

  return {
    totalGroups: groups.length,
    totalMembers: groups.reduce((sum, g) => sum + g.memberCount, 0),
    totalPastRSVPs: groups.reduce((sum, g) => sum + g.pastRSVPs, 0),
    totalPastEvents: groups.reduce((sum, g) => sum + g.pastEventCount, 0),
    totalUpcomingEvents: groups.reduce((sum, g) => sum + g.upcomingEvents, 0),
    totalEventsFor2024: eventsIn2024.length,
    totalEventsFor2025: eventsIn2025.length,
    physicalEvents2024: eventsIn2024.filter(e => isEventType(e, 'Physical')).length,
    physicalEvents2025: eventsIn2025.filter(e => isEventType(e, 'Physical')).length,
    hybridEvents2024: eventsIn2024.filter(e => isEventType(e, 'Hybrid')).length,
    hybridEvents2025: eventsIn2025.filter(e => isEventType(e, 'Hybrid')).length,
    onlineEvents2024: eventsIn2024.filter(e => isEventType(e, 'Online')).length,
    onlineEvents2025: eventsIn2025.filter(e => isEventType(e, 'Online')).length,
    totalRSVP2024: eventsIn2024.reduce((sum, e) => sum + e.rsvpCount, 0),
    totalRSVP2025: eventsIn2025.reduce((sum, e) => sum + e.rsvpCount, 0),
  };
}

/**
 * Determine region based on city/country
 */
export function getRegionFromCity(city: string): 'AMER' | 'APAC' | 'EMEA' | 'Unknown' {
  const cityLower = city.toLowerCase();
  
  // AMER
  const amerCities = ['new york', 'san francisco', 'chicago', 'toronto', 'boston', 'austin', 'seattle'];
  if (amerCities.some(c => cityLower.includes(c))) return 'AMER';
  
  // APAC
  const apacCities = ['bengaluru', 'bangalore', 'delhi', 'mumbai', 'pune', 'singapore', 'sydney', 'melbourne', 'tokyo', 'brisbane'];
  if (apacCities.some(c => cityLower.includes(c))) return 'APAC';
  
  // EMEA
  const emeaCities = ['london', 'paris', 'berlin', 'amsterdam', 'madrid', 'barcelona'];
  if (emeaCities.some(c => cityLower.includes(c))) return 'EMEA';
  
  return 'Unknown';
}
