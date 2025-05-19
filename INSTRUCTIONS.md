# Portman Agent Development Instructions

## Project Overview
Portman Agent is an Azure-based application that tracks vessel port calls, integrating with Digitraffic API and providing a web interface for data management.

## Tech Stack
- Backend: Python (Azure Functions)
- Frontend: React + TypeScript + Vite
- UI Libraries: Material-UI & Shadcn/ui
- Database: PostgreSQL
- Infrastructure: Terraform
- CI/CD: GitHub Actions

## Development Guidelines

### Code Style
- All code comments and documentation must be in English
- Python: Follow PEP 8
- TypeScript: Use strict mode
- Consistent naming conventions
- Clean code structure

### Testing
- Unit tests for all new features
- Cypress for frontend E2E testing
- Jest for frontend unit testing
- Document test cases

### Documentation
- Keep all README files updated
- Document API changes
- Update deployment instructions
- Clear commit messages

### Security
- No sensitive data in commits
- Use environment variables for secrets
- Follow Azure security best practices
- Regular security audits

### Deployment
- Test in development first
- Use GitHub Actions for CI/CD
- Follow Terraform deployment process
- Monitor deployment logs

### Database
- Follow PostgreSQL best practices
- Use migrations for schema changes
- Document database changes
- Regular backups

### Error Handling
- Proper error logging
- Use Application Insights
- Meaningful error messages
- Document error scenarios

## Project Structure

### Key Directories
- `portman_ui/`: Frontend application
- `PortmanTrigger/`: Azure Function triggers
- `PortmanXMLConverter/`: XML conversion functionality
- `PortmanNotificator/`: Notification system
- `modules/`: Terraform infrastructure modules
- `environments/`: Terraform environment configs

### Frontend Structure
- `components/`: Reusable UI components
- `pages/`: Main application views
- `services/`: API interactions
- `context/`: React context providers
- `types/`: TypeScript definitions

### Backend Structure
- `function_app.py`: Main Azure Function App
- `config.py`: Configuration settings
- `PortmanTrigger/`: Core functionality
- `PortmanXMLConverter/`: XML processing
- `PortmanNotificator/`: Notification handling

## Development Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Update documentation
5. Create PR
6. Review and merge

## Resources
- [GitHub Repository](https://github.com/herratomsiili/portman_agent)
- [Digitraffic API](https://meri.digitraffic.fi/api/ais/v1/locations)
- [Azure Portal](https://portal.azure.com)

# Project Instructions

- Keep answers short & precise.
- Be effective.
- All comments in the code should be in English.
- Keep this `INSTRUCTIONS.md` file updated for reference and context.

## UI Assets

### Icons and Logos
The application uses the following icon and logo files:
- `Portman_icon_v2.svg` - Main application icon used for favicon and app icon
- `Portman_icon_v3.svg` - Alternative application icon
- `Portman_logo_v2.svg` - Full logo for larger displays
- `Portman_logo_v3.svg` - Updated full logo used in the navigation drawer

These icons are located in the `portman_ui/public/images/` directory and are used throughout the application.

#### Logo Placement
- The `Portman_logo_v3.svg` is displayed in the sidebar/drawer
- The `Portman_icon_v2.svg` appears in the app bar for unauthenticated users
- The favicon and other browser icons use `Portman_icon_v2.svg`

## XML Downloads

The application provides functionality to download XML documents in different formats:

- **ATA XML**: Actual Time of Arrival XML documents
- **NOA XML**: Notification of Arrival XML documents
- **VID XML**: Vessel Information Data XML documents

These XML buttons are available in the Port Calls view:
- VID XML button appears next to vessel name in the Vessel column
- ATA XML button appears in the ATA column
- NOA XML button appears in the ETA column

Each button only appears when the corresponding XML is available for a port call.

### XML Viewing Dialog

The application uses a dialog component to display XML documents:

- The `XmlViewDialog` component displays XML content with options to view as XML or YAML
- To prevent CORS issues when fetching external XML files, the application uses a direct download approach:
  1. Uses the browser's native `fetch` API to download the XML file as a blob
  2. Processes the downloaded blob with FileReader to read as text
  3. This avoids CORS restrictions which only apply to XMLHttpRequest/Axios requests
  4. Allows viewing XML files hosted on different domains without proxy requirements
- A Download button allows users to save the XML document to their computer
  1. Creates a Blob from the XML content
  2. Sets appropriate MIME type for XML files
  3. Preserves the original filename from Azure Blob Storage using Content-Disposition headers where available

The component also supports converting XML to YAML format for easier readability.

#### Enhanced XML Viewing Features

The XML View dialog includes several enhanced features for better usability:

- **Syntax Highlighting**: XML/YAML content displays with color-coded syntax highlighting for better readability
- **Line Numbers**: Each line is numbered for easier reference and debugging
- **Search Functionality**:
  1. Users can search for text within the XML/YAML content
  2. Shows match count and allows navigation between matches
  3. Highlighting of matched text with yellow background
  4. Automatic scrolling to the current match
- **Fullscreen Mode**: Toggle between regular and fullscreen views for better visibility of large documents
- **Improved UI**:
  1. Colored header bar matching application theme
  2. Better organization of controls and buttons
  3. Display of the original filename in the footer
  4. Consistent styling with the rest of the application

## Port Calls View Features

### Sorting
Port calls are ordered from newest to oldest by default:
- Server-side sorting by created date (descending)
- Client-side sorting for consistency

### Status Filtering
Port calls can be filtered by their current status:
- Filter tabs for "All", "Arrived", "Expected", "Arriving Soon", "Delayed", and "Completed"
- Each tab shows the count of port calls in that status
- Visual indicators with color-coded chips for each status

### Date Range Filtering
Port calls can be filtered by date range:
- Default range: Last 7 days (one week from today)
- Filter panel with start/end date input fields
- Clear filters button to reset to default range
- Collapsible filter panel with toggle button

### User Experience Enhancements
- Loading skeletons during data fetching
- Expandable rows with detailed port call information
- Organized details with categorized sections and icons
- Hover effects for better interactivity
- Expand/collapse indicators

### Data Loading Optimization
- Date filtering performed server-side
- Date parameters use DAB OData $filter syntax (e.g., "$filter=eta ge [date] and eta le [date]")
- Pagination maintains date filter constraints

## Routing Configuration

### Protected Routes
The application uses a protected route system that requires authentication for certain routes. The routes are configured in `App.tsx`.

- **Public routes**: Accessible without login
  - `/`
  - `/login`
  - `/port-calls`
  - `/vessel-tracking` (Note: Moved outside protected routes wrapper for direct access)

- **Protected routes**: Require user authentication
  - `/dashboard`
  - `/vessel/:imo`
  - `/reports`

- **Admin routes**: Require admin privileges
  - `/port-call-management`
  - `/settings`

### Route Protection Levels
- Routes wrapped with `<ProtectedRoute />` require basic authentication
- Routes wrapped with `<ProtectedRoute requiredRole="admin" />` require admin privileges
- Routes outside these wrappers are publicly accessible

If you need to modify route access permissions, adjust the route configuration in `App.tsx`.

## Mobile Responsiveness

### Port Calls View Mobile Optimizations
The Port Calls view has been enhanced for better mobile responsiveness with the following features:

- **Font Size Adjustments**:
  - Smaller font sizes on mobile for better readability
  - Graduated text scaling that increases at larger breakpoints

- **Table Layout Optimizations**:
  - Adjusted column widths for mobile screens (Vessel: 40%, Status: 25%, Port: 35%)
  - Hidden columns (ETA, ATA, ETD) on small screens (below md breakpoint)
  - Condensed padding in table cells for mobile
  - Appropriate text overflow handling

- **Mobile-Specific Time Information Panel**:
  - Compact time information display shown only on small screens
  - Includes ETA, ATA, ETD, and ATD in a grid layout
  - XML preview buttons maintained but sized appropriately for touch targets
  - Appears at the top of the expanded details section

- **Responsive UI Elements**:
  - Smaller button sizes with proper touch target sizing
  - Properly sized status chips with smaller text on mobile
  - Improved spacing in the expandable detail sections
  - Two-column layout for details on tablets, single column on phones

- **Better Navigation Controls**:
  - Table pagination optimized for small screens
  - Simplified row count display on mobile
  - Responsive action buttons with appropriate sizing

- **Layout Improvements**:
  - Reduced margins and padding on small screens
  - Properly stacked filter and search controls
  - Horizontally scrollable tabs for status filtering
  - Responsive grid layout for date filters

These changes ensure the Port Calls view provides an optimal experience across devices from mobile phones to desktop, maintaining functionality while adapting the UI to different screen sizes. 