# Meetup Analytics Dashboard

A modern, responsive analytics dashboard for visualizing Meetup groups and events data from Google Sheets. Built with Next.js, TypeScript, and Tailwind CSS.

## ✨ Features

### 📊 Real-time Analytics
- **KPI Cards**: Total Groups, Members, Events, and RSVPs
- **Dynamic Year Statistics**: Automatically detects and displays stats for all available years (up to 20 years back)
- **Year-over-Year Growth**: Automatic YoY growth calculations between consecutive years
- **Interactive Charts**: Top groups by members and RSVPs with expandable views
- **Data Tables**: Sortable, paginated tables with flexible display options (10/25/50/All)

### 🎯 Advanced Filtering
- **Regional Filters**: AMER, APAC, EMEA
- **Group Selection**: Multi-select with auto-selection on search
- **Event Types**: Physical, Online, Hybrid
- **Smart Search**: Search groups and cities with instant results
- **Selected First**: Selected groups automatically move to the top of filter lists

### 🔧 Production-Ready Features
- **Dynamic Year Detection**: Automatically detects available "Events YYYY" sheets
- **No Hardcoded Years**: Handles any number of years from current year back to 20 years
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Fast Performance**: Optimized with React memoization and efficient filtering
- **Type-Safe**: Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Google Sheets with your Meetup data
- Google Cloud Project with Sheets API enabled

### Installation

1. **Clone and Install**
\`\`\`bash
cd meetup-dashboard
npm install
\`\`\`

2. **Configure Environment**

Create `.env` file:
```bash
cp example.env .env
```

Edit `.env` with your configuration:
```env
# Google Sheets API Key
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_here

# Single Spreadsheet ID
NEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id_here

# Groups Sheet Tab Names by region
NEXT_PUBLIC_GROUPS_SHEETS="AMER Dashboard,EMEA Dashboard,APAC Dashboard"

# Summary Sheet Tab Name (optional)
NEXT_PUBLIC_SUMMARY_SHEET="Consolidated Dashboard"
```

**Note:** Events sheets are automatically detected - no need to configure them!

3. **Run Development Server**
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

4. **Build for Production**
\`\`\`bash
npm run build
npm start
\`\`\`

## 📋 Google Sheets Setup

### 1. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**
4. Create credentials → **API Key**
5. (Recommended) Restrict the API key to Google Sheets API only

### 2. Prepare Your Spreadsheet

Your spreadsheet should contain the following tabs:

#### Required Tabs:
- **UG+Regions** - Groups data with regions
- **Events YYYY** - Event data (e.g., Events 2024, Events 2025, Events 2026)
  - The dashboard automatically detects all "Events YYYY" sheets
  - Supports current year back to 20 years

#### Sheet Structures:

**UG+Regions Sheet** (Groups):
\`\`\`
Timestamp | User Group Name | Member Count | City | Region | Past RSVPs | Past Event Count | ...
\`\`\`

**Events YYYY Sheets**:
\`\`\`
Timestamp | Meetup Title | Meetup URL | Meetup Date | Meetup Group Name | Meetup City | RSVP Count | Meetup Type
\`\`\`

**Important:** 
- Meetup Type should be: \`Physical\`, \`Online\`, or \`Hybrid\`
- Make your spreadsheet **publicly accessible** or share with API credentials

### 3. Get Your Configuration

**Spreadsheet ID:**
From URL: \`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit\`

**Make Sheet Public:**
1. Open your Google Sheet
2. Click "Share" → "Anyone with the link can view"
3. Click "Done"

## 📁 Project Structure

\`\`\`
meetup-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Main dashboard (dynamic year handling)
│   │   ├── globals.css        # Global styles
│   │   └── robots.ts          # SEO robots config
│   ├── components/
│   │   ├── KPICard.tsx        # Metric display cards
│   │   ├── ChartCard.tsx      # Chart components with expand
│   │   ├── DataTable.tsx      # Sortable/paginated tables
│   │   └── FilterPanel.tsx    # Multi-filter sidebar
│   ├── lib/
│   │   └── sheetsService.ts   # Google Sheets API + dynamic year detection
│   └── types/
│       └── index.ts           # TypeScript definitions
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
├── .env                       # Environment configuration (create from example.env)
├── example.env                # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
\`\`\`

## 🎨 Key Features Explained

### Dynamic Year Detection

The dashboard automatically:
1. Fetches spreadsheet metadata to get all sheet names
2. Identifies sheets matching "Events YYYY" pattern
3. Fetches data from all available years (current year back to 20 years)
4. Calculates statistics and YoY growth dynamically
5. Renders year cards in descending order

**No hardcoded years** - Add a new "Events 2027" sheet and it will automatically appear!

### Smart Filtering

- **Auto-selection**: Searching for a city/group auto-selects matching groups
- **Selected First**: Selected groups move to top of filter list in bold
- **Regional Mapping**: Multi-strategy matching (exact, city, fuzzy, partial)
- **Dynamic Stats**: All KPIs and charts update based on active filters

### Expandable Charts

- Click expand icon on any chart to see full data
- Horizontal bar layout in expanded view
- ESC key or X button to close
- Shows all groups (not just top 10)

## 🚀 Deployment

### Vercel (Recommended)

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

Add environment variables in Vercel dashboard:
- \`NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY\`
- \`NEXT_PUBLIC_SPREADSHEET_ID\`

### Other Platforms

Supports any Next.js-compatible platform:
- Netlify
- AWS Amplify  
- Google Cloud Run
- Azure Static Web Apps
- Railway

## ⚙️ Customization

### Update Region Mappings

Edit \`src/lib/sheetsService.ts\` → \`getRegionFromCity()\` function:

\`\`\`typescript
export function getRegionFromCity(city: string): string {
  const cityLower = city.toLowerCase();
  
  // Add your cities here
  if (cityLower.includes('new york')) return 'AMER';
  // ...
}
\`\`\`

### Modify Color Scheme

Edit \`tailwind.config.js\`:

\`\`\`javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Your custom colors
      }
    }
  }
}
\`\`\`

### Adjust Chart Display

In \`src/app/page.tsx\`, modify:
- \`membersByGroup\` - Change \`.slice(0, 10)\` to show more/fewer groups
- Chart colors in ChartCard components
- Grid layouts for responsive behavior

## �� Troubleshooting

### Data Not Loading

1. **Check browser console** for error messages
2. **Verify API key** is correct in \`.env\`
3. **Ensure sheets are public** or properly shared
4. **Check spreadsheet ID** in \`.env\` file
5. **Verify sheet tab names**:
   - Must have \`UG+Regions\` tab
   - Must have at least one \`Events YYYY\` tab
6. **Column names** must match expected format (case-insensitive)

### Year Statistics Showing 0

1. Check that events have proper year field extraction
2. Verify sheet names follow "Events YYYY" pattern
3. Look for console logs showing year detection
4. Check event type values (should be Physical/Online/Hybrid)

### Filters Not Working

1. Clear browser cache and reload
2. Check console for filtering errors
3. Verify group names match between UG+Regions and Events sheets
4. Test with "Clear All Filters" button

### Performance Issues

1. **Large datasets** (1000+ groups): Consider pagination limits
2. **Slow initial load**: Check network tab for API response times
3. **Memory issues**: Refresh page to reset state

## 🛠 Built With

- **[Next.js 14](https://nextjs.org/)** - React framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Recharts](https://recharts.org/)** - Data visualization
- **[Lucide React](https://lucide.dev/)** - Icons
- **[date-fns](https://date-fns.org/)** - Date utilities
- **[Google Sheets API v4](https://developers.google.com/sheets/api)** - Data source

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Version:** 1.0.0  
**Last Updated:** January 2026
