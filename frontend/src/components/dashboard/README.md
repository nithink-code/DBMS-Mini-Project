# Dashboard Components

This folder contains the enhanced dashboard components for the Podcast Web Application with full CRUD (Create, Read, Update, Delete) functionality.

## Components Overview

### 1. DashboardOverview.jsx
The main dashboard overview component that orchestrates all the popular sections.

**Features:**
- Displays statistics cards for hosts, shows, episodes, and advertisers
- Integrates all popular sections (hosts, shows, episodes, advertisers)
- Shows limited items (3 per section) with "View All" navigation
- "Load Sample Data" button to initialize default content
- Animated entrance effects using Framer Motion
- Responsive layout

**Props:**
- `popularHosts` - Array of popular host objects
- `popularShows` - Array of popular show objects
- `popularEpisodes` - Array of popular episode objects
- `popularAdvertisers` - Array of popular advertiser objects
- `allHosts` - Array of all hosts (for dropdowns)
- `allShows` - Array of all shows (for dropdowns)
- `onRefresh` - Function to refresh data after CRUD operations
- `getAuthHeaders` - Function to get authorization headers
- `onNavigateToTab` - Function to navigate to specific tabs
- `showInitButton` - Boolean to show/hide initialization button
- `onInitializeDefaults` - Function to load default sample data

### 2. PopularHosts.jsx
Manages the display and CRUD operations for popular podcast hosts.

**Features:**
- View popular hosts in a grid layout (limited to 3 on dashboard)
- "View All" button to navigate to full hosts page
- Create new hosts with dialog form
- Edit existing host information
- Delete hosts with confirmation
- Image URL support with placeholder avatars
- Empty state with call-to-action

**Props:**
- `hosts` - Array of host objects
- `onRefresh` - Refresh callback
- `getAuthHeaders` - Auth headers function
- `onViewAll` - Navigation callback (optional)
- `showLimit` - Number of items to display (default: 3)

**Form Fields:**
- Host Name (required)
- Email Address (required)
- Bio (required, textarea)
- Image URL (optional)

### 3. PopularShows.jsx
Manages the display and CRUD operations for popular podcast shows.

**Features:**
- View popular shows in a grid layout
- Create new shows with dialog form
- Edit existing show information
- Delete shows with confirmation
- Cover image support with placeholder
- Status badges (active, paused, completed)
- Empty state with call-to-action

**Form Fields:**
- Show Title (required)
- Host (required, dropdown select)
- Category (required)
- Description (required, textarea)
- Status (required, dropdown: active/paused/completed)
- Cover Image URL (optional)

### 4. PopularEpisodes.jsx
Manages the display and CRUD operations for recent podcast episodes.

**Features:**
- View recent episodes in a grid layout
- Create new episodes with dialog form
- Edit existing episode information
- Delete episodes with confirmation
- Duration and episode number display
- Status badges (draft, published, archived)
- Empty state with call-to-action

**Form Fields:**
- Show (required, dropdown select)
- Episode Title (required)
- Episode Number (required, number)
- Duration in Minutes (required, number)
- Description (required, textarea)
- Status (required, dropdown: draft/published/archived)
- Audio URL (optional)

### 5. PopularAdvertisers.jsx
Manages the display and CRUD operations for top advertisers.

**Features:**
- View top advertisers in a grid layout
- Create new advertisers with dialog form
- Edit existing advertiser information
- Delete advertisers with confirmation
- Budget display with currency formatting
- Status badges (active, inactive, pending)
- Empty state with call-to-action

**Form Fields:**
- Company Name (required)
- Contact Person (required)
- Email (required)
- Phone (required)
- Budget in USD (required, number with decimals)
- Status (required, dropdown: active/inactive/pending)

## Styling

All components use custom CSS classes defined in `App.css`:

### Key CSS Classes:
- `.dashboard-overview` - Main container
- `.popular-section` - Section wrapper with hover effects
- `.popular-header` - Header with title and action button
- `.popular-grid` - Responsive grid layout
- `.popular-card` - Individual item card with hover effects
- `.card-image` - Image container with gradients
- `.card-content` - Card text content
- `.card-actions` - Action buttons (edit/delete)
- `.empty-state` - Empty state display
- `.dashboard-dialog` - Form dialog
- `.dashboard-form` - Form styling
- `.stat-card` - Statistics cards

### Design Features:
- Modern, clean UI with smooth animations
- Gradient accents and hover effects
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Glassmorphism effects
- Icon integration with Lucide React

## API Integration

All components interact with the backend API using axios:

### Endpoints Used:
- `GET /api/hosts/popular/list` - Fetch popular hosts
- `POST /api/hosts` - Create new host
- `PUT /api/hosts/:id` - Update host
- `DELETE /api/hosts/:id` - Delete host
- `POST /api/initialize-defaults` - Load sample default data

Similar patterns for shows, episodes, and advertisers.

### Authorization:
All requests include JWT token in headers via `getAuthHeaders()` function.

## Default Data Initialization

The application includes a feature to load sample data for new users:

### Sample Data Includes:
- **3 Hosts**: Alex Johnson (Tech), Sarah Miller (Business), Marcus Chen (Comedy)
- **3 Shows**: Tech Trends Weekly, Business Breakthrough, Daily Laughs
- **5 Episodes**: Various episodes across different shows
- **4 Advertisers**: Tech and business companies with budgets

### How It Works:
1. When dashboard loads with no data, "Load Sample Data" button appears
2. Clicking the button calls `/api/initialize-defaults` endpoint
3. Backend creates default hosts, shows, episodes, and advertisers
4. Dashboard refreshes to display the new data
5. Button only appears once - won't re-initialize if data exists

## Usage Example

```jsx
import DashboardOverview from '@/components/dashboard/DashboardOverview';

<DashboardOverview 
  popularHosts={popularHosts} 
  popularShows={popularShows} 
  popularEpisodes={popularEpisodes} 
  popularAdvertisers={popularAdvertisers}
  allHosts={hosts}
  allShows={shows}
  onRefresh={handleRefresh}
  getAuthHeaders={getAuthHeaders}
  onNavigateToTab={(tab) => setActiveTab(tab)}
  showInitButton={showInitButton}
  onInitializeDefaults={initializeDefaults}
/>
```

## Navigation

The dashboard now includes smart navigation:

- **View All Buttons**: Each section has a "View All" button that appears when there are more than 3 items
- **Tab Navigation**: Clicking "View All" navigates to the respective full page (Hosts, Shows, Episodes, or Advertisers)
- **Mobile Friendly**: Navigation works seamlessly on mobile with the menu closing automatically

## Dependencies

- React (hooks: useState)
- Framer Motion (animations)
- Lucide React (icons)
- Axios (API calls)
- Sonner (toast notifications)
- Radix UI components (via shadcn/ui):
  - Card
  - Button
  - Input
  - Textarea
  - Label
  - Dialog
  - Select
  - Badge

## Responsive Breakpoints

- **Desktop**: > 768px - Full grid layout
- **Tablet**: 481px - 768px - Adjusted grid
- **Mobile**: < 480px - Single column layout

## Animation Details

Using Framer Motion for:
- Staggered children animations
- Fade in/out transitions
- Scale transformations
- Smooth entrance effects with delays

## Best Practices

1. **Error Handling**: All CRUD operations include try-catch blocks with user-friendly toast messages
2. **Confirmation Dialogs**: Delete operations require user confirmation
3. **Form Validation**: Required fields are enforced with HTML5 validation
4. **Responsive Design**: Components adapt to all screen sizes
5. **Accessibility**: Proper ARIA labels and semantic HTML
6. **Performance**: Optimized re-renders and efficient state management

## Future Enhancements

- Pagination for large datasets
- Search and filter functionality
- Bulk operations
- Drag-and-drop reordering
- Image upload functionality
- Advanced analytics views
- Export functionality
