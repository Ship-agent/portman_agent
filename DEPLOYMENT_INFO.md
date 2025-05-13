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