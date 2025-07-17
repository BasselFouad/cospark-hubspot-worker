# CoSpark AI HubSpot Proxy Worker

A Cloudflare Worker that serves as a CORS-enabled proxy for HubSpot API integration. This worker allows your frontend application to securely send contact data to HubSpot without exposing your API keys or dealing with CORS issues.

## Features

- ✅ **CORS Support** - Handles preflight requests and allows cross-origin requests
- ✅ **HubSpot Integration** - Creates and updates contacts in HubSpot CRM
- ✅ **Data Validation** - Validates incoming contact data before sending to HubSpot
- ✅ **Error Handling** - Comprehensive error handling with meaningful error messages
- ✅ **Environment Support** - Separate configurations for development and production
- ✅ **Health Check** - Built-in health check endpoint for monitoring
- ✅ **Secure Token Storage** - No API keys stored in code or config files

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

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your HubSpot Token

1. Go to HubSpot Settings → Integrations → Private Apps
2. Create a new private app with these scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.schemas.contacts.read`
3. Copy the access token (you'll use this in step 4)

### 3. Login to Cloudflare

```bash
npx wrangler login
```

### 4. Deploy the Worker

```bash
npm run deploy
```

### 5. Set Environment Variables (Choose one method)

#### Method A: Via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → Find your worker `cospark-hubspot-proxy`
3. Go to **Settings** → **Variables**
4. Add Environment Variable:
   - **Name**: `HUBSPOT_ACCESS_TOKEN`
   - **Value**: Your HubSpot token
   - **Encrypt**: ✅ (Important!)
5. Click **Save and Deploy**

#### Method B: Via Wrangler CLI (More Secure)

```bash
npx wrangler secret put HUBSPOT_ACCESS_TOKEN
# Enter your HubSpot token when prompted
```

## Development

### Local Development

For local development, create a `.env` file (not committed to git):

```bash
# .env (local only - not committed)
HUBSPOT_ACCESS_TOKEN=your_token_here
```

Then run:

```bash
npm run dev
```

This starts the worker locally at `http://localhost:8787`

### Test Locally

```bash
npm run test
```

Runs the worker in local-only mode for testing

## Deployment

### Development Deployment

```bash
npm run deploy
```

### Production Deployment

```bash
npm run publish
```

After deployment, your worker will be available at:
`https://cospark-hubspot-proxy.your-subdomain.workers.dev`

## Frontend Integration

Update your frontend service to use the worker endpoint:

```typescript
// Update your hubspotService.ts
const WORKER_URL = 'https://cospark-hubspot-proxy.your-subdomain.workers.dev';

async createContact(contactData: ContactData): Promise<any> {
  try {
    const response = await fetch(`${WORKER_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(result.message || 'Failed to create contact');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating contact via worker:', error);
    throw error;
  }
}
```

## Security Features

- ✅ **No API Key Exposure** - HubSpot tokens stored securely in Cloudflare (encrypted)
- ✅ **Origin Validation** - Only allows requests from configured domains
- ✅ **Input Validation** - Validates all incoming data before processing
- ✅ **Error Handling** - Doesn't expose internal errors to clients
- ✅ **No Secrets in Code** - All sensitive data stored as encrypted environment variables

## Monitoring

- Check deployment status: `npx wrangler deployments list`
- View logs: `npx wrangler tail`
- Monitor via Cloudflare dashboard

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Verify your domain is in `ALLOWED_ORIGINS` in wrangler.toml
   - Check that the worker is deployed and accessible

2. **HubSpot API Errors**

   - Verify your access token is correctly set in Cloudflare environment variables
   - Ensure your HubSpot app has the required scopes

3. **Environment Variable Issues**

   - Check that `HUBSPOT_ACCESS_TOKEN` is set in Cloudflare Dashboard
   - Ensure the variable is encrypted
   - Redeploy after setting environment variables

4. **Validation Errors**
   - Check that all required fields (name, email, phone) are provided
   - Verify email format is valid

### Debug Mode

Enable debug logs by viewing worker logs:

```bash
npx wrangler tail
```

## License

MIT
