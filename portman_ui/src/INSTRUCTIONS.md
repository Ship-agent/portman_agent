# Portman UI Instructions

This document provides information about the Portman UI application, its components, and how to interact with APIs.

## API Endpoints

### Paginated APIs

The application supports paginated API endpoints for data that could return large result sets:

- `/arrivals` - Fetches vessel arrival data with pagination
- `/voyages` - Fetches port call data with pagination

Both endpoints use the same pagination pattern:
- The initial request returns up to 100 items
- If more data is available, a `nextLink` property is included in the response
- The `nextLink` contains a URL with an `$after` parameter that can be used to fetch the next page

## Components

### Tables with Auto-Loading

The following views implement automatic data loading functionality:

- `Arrivals.tsx` - Lists vessel arrival information
- `PortCalls.tsx` - Lists port call information

These components:
1. Automatically fetch all available data recursively
2. Show loading indicators during data retrieval
3. Display the total count of records loaded
4. Implement search functionality to filter the data
5. Allow changing rows per page and navigating between pages

When implementing new tables that need to access large datasets:
1. Create a paginated API method in `api.ts` similar to `getArrivals` or `getPortCallsPaginated`
2. Use the recursive loading pattern seen in these components
3. Include appropriate loading indicators and error handling

## Search Functionality

All table components implement client-side search that filters already loaded data. Search is typically performed on:
- Vessel names
- Port names
- IDs (like portcallid or IMO numbers)

## Status Indicators

- Arrivals use color-coded chips:
  - Green: New Arrival
  - Orange: Updated Arrival
  
- Port Calls use color-coded chips:
  - Green: Arrived (has ATA)
  - Blue: Expected (no ATA yet)

## XML Downloads

The application provides XML download functionality in the Port Calls view:

- **VID XML**: Vessel Information Data - appears next to vessel name in the Vessel column
- **ATA XML**: Actual Time of Arrival - appears in the ATA column
- **NOA XML**: Notification of Arrival - appears in the ETA column

Each button only appears when the corresponding XML is available for a port call.

## Port Calls View

### Sorting
Port calls are ordered from newest to oldest by default:
- Server-side sorting by created date (descending)
- Client-side sorting for consistency

### Date Range Filtering
The Port Calls view includes date range filtering:
- Default range: Last 7 days (one week from today)
- Start/end date input fields
- Clear filters button resets to default range
- Filter toggle button shows/hides the filter panel

### Data Loading Optimization
- Date filtering performed server-side
- Date parameters use DAB OData $filter syntax (e.g., "$filter=eta ge [date] and eta le [date]")
- Pagination maintains date filter constraints

## Deployment

For information about the CI/CD pipeline that deploys the UI to Azure Static Web Apps, see the DEPLOYMENT_INFO.md file in the project root. 