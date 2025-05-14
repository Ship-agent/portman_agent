# Portman UI

Portman UI is a modern, TypeScript-based React frontend for tracking maritime vessel port calls. It integrates with the Portman Agent backend and is designed for responsive use on desktop and mobile devices.

Built using [Vite](https://vitejs.dev/) for blazing fast development and optimized production builds.

---

## 🚀 Features

- ⚛️ React 19 with TypeScript
- 🎨 Material UI (MUI 6) + Emotion for styling
- 📊 Chart.js integration for data visualization
- 🔗 React Router v7 for navigation
- 🔍 Axios for API communication
- 🧪 Testing with Testing Library + Jest + Cypress

---

## 🛠️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add .env file to /portman_ui/ directory with
- Azure API url
- digitraffic AIS data URL

### 3. Start development server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. 📦 Build for Production

```bash
npm run build
```

Compiled output will be located in the dist/ directory.

### 5. 🔍 Preview Production Build

```bash
npm run preview
```

Runs a local static file server to test the production build.

### 6. 🧪 Run Tests

```bash
npm test
```

### 7. 🧹 Lint the Project

```bash
npm run lint
```

### UI Structure

```plaintext
portman-ui/
├── cypress/            # Cypress tests
├── public/             # Static assets (favicon, manifest, etc.)
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # Authentication context provider
│   ├── data/           # Mock data (not needed anymore)
│   ├── pages/          # UI views
│   ├── services/       # UI service layer (only api.ts at the moment)
│   ├── types/          # Types used in the UI
│   ├── .env            # API endpoints etc
│   ├── App.css         # Styles
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── index.html      # Vite HTML entry
├── .gitignore
├── cypress.config.ts   # Cypress configurations
├── eslint.config.js    # ESLint configurations
├── jest.config.js      # Jest configurations
├── package.json        # UI dependencies etc
├── package-lock.json
├── README.md           # Documentation
├── setupTests.ts       # Jest configurations
├── tsconfig.json       # Typescript configurations
├── UI_TESTING.md       # UI testing readme
├── vite.config.ts      # Vite config
```

## Testing

Refer to `UI_TESTING.md`

# UI Deployment Process

The Portman UI is deployed to Azure Static Web Apps through GitHub Actions CI/CD pipeline.

## Automatic Deployment

UI updates are automatically deployed when:
- Code is pushed to the `main` branch
- Pull requests are merged to `main`

The deployment pipeline:
1. Provisions infrastructure with Terraform
2. Builds the React app with proper environment variables
3. Deploys to Azure Static Web Apps

## Manual Deployment

To manually trigger a deployment:

1. Navigate to GitHub Actions
2. Select "Terraform Deployment" workflow
3. Click "Run workflow"
4. Select the target environment (development, testing, production)
5. Start the workflow

## Environment Configuration

The UI connects to different backend APIs based on environment:
- API URLs are injected during build via `.env` file
- Each environment has its own configuration

## Troubleshooting

Common issues:
- Build failures: Check GitHub Actions logs
- API connection issues: Verify environment variables
- Authentication problems: Check Azure access tokens

## Monitoring

After deployment:
- Check Azure Portal for Static Web App status
- Verify endpoint availability
- Monitor application logs 
