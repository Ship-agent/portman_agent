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

## Port Calls View Features

### Sorting
Port calls are ordered from newest to oldest by default:
- Server-side sorting by created date (descending)
- Client-side sorting for consistency

### Date Range Filtering
Port calls can be filtered by date range:
- Default range: Last 7 days (one week from today)
- Filter panel with start/end date input fields
- Clear filters button to reset to default range
- Collapsible filter panel with toggle button

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