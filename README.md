# CoSpark AI HubSpot Proxy Worker

A Cloudflare Worker that serves as a CORS-enabled proxy for HubSpot API integration. This worker allows your frontend application to securely send contact data to HubSpot without exposing your API keys or dealing with CORS issues.

**🚀 Deployed automatically via GitHub + Cloudflare integration**

## Features

- ✅ **CORS Support** - Handles preflight requests and allows cross-origin requests
- ✅ **HubSpot Integration** - Creates and updates contacts in HubSpot CRM
- ✅ **Data Validation** - Validates incoming contact data before sending to HubSpot
- ✅ **Error Handling** - Comprehensive error handling with meaningful error messages
- ✅ **Environment Support** - Separate configurations for development and production
- ✅ **Health Check** - Built-in health check endpoint for monitoring
- ✅ **Secure Token Storage** - No API keys stored in code or config files
- ✅ **Auto Deployment** - Automatic deployment via GitHub Actions

## API Endpoints

### `POST /contacts`

Creates or updates a contact in HubSpot.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@school.edu",
  "phone": "+1234567890",
  "school_name": "Sample Elementary School", // optional
  "position": "Principal" // optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    /* HubSpot contact object */
  },
  "message": "Contact created successfully"
}
```

### `GET /health`

Returns the health status of the worker.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "CoSpark HubSpot Proxy"
}
```

## 🚀 GitHub + Cloudflare Deployment Setup

### Prerequisites

1. **GitHub Account** - Repository for the code
2. **Cloudflare Account** - For hosting the Worker
3. **HubSpot Account** - With API access

### Step 1: Get Your Tokens

#### HubSpot Token

1. Go to HubSpot Settings → Integrations → Private Apps
2. Create a new private app with these scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.schemas.contacts.read`
3. Copy the access token

#### Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom token** with these permissions:
   - **Zone:Zone:Read** (for your domain)
   - **Zone:Zone Settings:Read**
   - **User:User Details:Read**
   - **Account:Cloudflare Workers:Edit**
4. Copy the token

### Step 2: Create GitHub Repository

1. **Create a new repository** on GitHub (or push this existing code)
2. **Add GitHub Secrets** in your repository settings:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
     - `HUBSPOT_ACCESS_TOKEN` - Your HubSpot access token

### Step 3: Push Code to GitHub

```bash
# If starting fresh
git init
git branch -m main
git add .
git commit -m "Initial commit: CoSpark HubSpot Proxy Worker"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/cospark-hubspot-worker.git
git push -u origin main
```

### Step 4: Configure Cloudflare Workers

1. **Go to Cloudflare Dashboard** → **Workers & Pages**
2. **Create a new Worker** (if needed) or find your deployed worker
3. **Set Environment Variables** in the worker settings:
   - `HUBSPOT_ACCESS_TOKEN` - Your HubSpot token (encrypted)

### Step 5: Automatic Deployment

Once you push to the `main` branch, GitHub Actions will automatically:

1. ✅ Install dependencies
2. ✅ Deploy to Cloudflare Workers (production environment)
3. ✅ Set up environment variables
4. ✅ Your worker will be live at: `https://cospark-hubspot-proxy-production.YOUR_SUBDOMAIN.workers.dev`

## 🔄 Development Workflow

### Making Changes

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit:

   ```bash
   git add .
   git commit -m "Add your feature"
   ```

3. **Push and create PR:**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request** on GitHub

   - This will deploy to development environment for testing

5. **Merge to main** - Automatically deploys to production

### Local Development (Optional)

```bash
npm install
npm run dev
```

Create a `.env` file for local testing:

```bash
# .env (not committed to git)
HUBSPOT_ACCESS_TOKEN=your_token_here
```

## 🔧 Frontend Integration

Update your frontend service to use the deployed worker:

```typescript
// Update your hubspotService.ts
const WORKER_URL =
  "https://cospark-hubspot-proxy-production.YOUR_SUBDOMAIN.workers.dev";

export class HubSpotService {
  async createContact(contactData: ContactData): Promise<any> {
    try {
      const response = await fetch(`${WORKER_URL}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          school_name: contactData.school_name,
          position: contactData.position,
        }),
      });

      if (!response.ok) {
        throw new Error(`Worker API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to create contact");
      }

      return result.data;
    } catch (error) {
      console.error("Error creating contact via worker:", error);
      throw error;
    }
  }
}
```

## 🔒 Security Features

- ✅ **No API Key Exposure** - HubSpot tokens stored securely in Cloudflare (encrypted)
- ✅ **Origin Validation** - Only allows requests from configured domains
- ✅ **Input Validation** - Validates all incoming data before processing
- ✅ **Error Handling** - Doesn't expose internal errors to clients
- ✅ **No Secrets in Code** - All sensitive data stored as encrypted environment variables
- ✅ **GitHub Secrets** - API tokens stored securely in GitHub

## 📊 Monitoring & Debugging

### View Deployment Status

- Check **GitHub Actions** tab in your repository
- Monitor **Cloudflare Dashboard** → **Workers & Pages**

### View Logs

```bash
# Install wrangler locally for debugging
npm install -g wrangler
wrangler tail cospark-hubspot-proxy-production
```

### Health Check

Visit: `https://your-worker-url.workers.dev/health`

## 🚨 Troubleshooting

### Deployment Issues

1. **GitHub Actions Failing**

   - Check that `CLOUDFLARE_API_TOKEN` and `HUBSPOT_ACCESS_TOKEN` are set in GitHub Secrets
   - Verify token permissions in Cloudflare

2. **Worker Not Responding**

   - Check Cloudflare Dashboard for error logs
   - Verify environment variables are set in worker settings

3. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in `wrangler.toml`
   - Redeploy via git push

### API Issues

1. **HubSpot Errors**

   - Verify token has correct scopes
   - Check HubSpot API status

2. **Validation Errors**
   - Ensure required fields (name, email, phone) are provided
   - Check email format

## 📝 Environment Variables

| Variable               | Description                     | Where to Set                          |
| ---------------------- | ------------------------------- | ------------------------------------- |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot API token               | GitHub Secrets + Cloudflare Dashboard |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token            | GitHub Secrets only                   |
| `ALLOWED_ORIGINS`      | Comma-separated allowed domains | `wrangler.toml`                       |

## 🏗️ Project Structure

```
cospark-hubspot-worker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── src/
│   └── index.js               # Worker main code
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── README.md                  # This file
└── wrangler.toml             # Cloudflare Worker configuration
```

## 📄 License

MIT
