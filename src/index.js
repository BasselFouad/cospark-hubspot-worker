/**
 * CoSpark AI HubSpot Proxy Worker
 * Handles CORS and proxies contact creation requests to HubSpot API
 */

// CORS headers for allowing requests from your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be dynamically set based on allowed origins
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Check if the origin is allowed
 */
function isOriginAllowed(origin, allowedOrigins) {
  if (!origin || !allowedOrigins) return false;
  
  const allowed = allowedOrigins.split(',').map(o => o.trim());
  return allowed.includes(origin) || allowed.includes('*');
}

/**
 * Handle CORS preflight requests
 */
function handleCors(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS || '';
  
  if (isOriginAllowed(origin, allowedOrigins)) {
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
  
  return new Response('Origin not allowed', { status: 403 });
}

/**
 * Validate contact data
 */
function validateContactData(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
    errors.push('Phone number is required');
  }
  
  return errors;
}

/**
 * Create or update contact in HubSpot
 */
async function createHubSpotContact(contactData, env) {
  // Split name into first and last name
  const nameParts = contactData.name.trim().split(' ');
  const firstname = nameParts[0] || '';
  const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  
  // Prepare HubSpot contact properties
  const hubspotContact = {
    properties: {
      email: contactData.email,
      firstname,
      lastname,
      ...(contactData.phone && { phone: contactData.phone }),
      ...(contactData.school_name && { company: contactData.school_name }),
      ...(contactData.position && { jobtitle: contactData.position }),
    },
  };
  
  try {
    // Try to create the contact
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(hubspotContact),
    });
    
    if (response.status === 409) {
      // Contact already exists, try to update
      console.log(`Contact ${contactData.email} already exists, attempting update`);
      return await updateExistingContact(contactData, hubspotContact, env);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HubSpot API error:', response.status, errorText);
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Successfully created HubSpot contact: ${contactData.email}`);
    return result;
    
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    throw error;
  }
}

/**
 * Update existing contact in HubSpot
 */
async function updateExistingContact(contactData, hubspotContact, env) {
  try {
    // Search for the contact by email
    const searchPayload = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: contactData.email,
            },
          ],
        },
      ],
    };
    
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(searchPayload),
    });
    
    if (!searchResponse.ok) {
      throw new Error(`HubSpot search error: ${searchResponse.status}`);
    }
    
    const searchResult = await searchResponse.json();
    
    if (searchResult.results && searchResult.results.length > 0) {
      const contactId = searchResult.results[0].id;
      
      // Update the contact (exclude email from update)
      const updateData = {
        properties: Object.fromEntries(
          Object.entries(hubspotContact.properties).filter(([key]) => key !== 'email')
        ),
      };
      console.log("-------")
      console.log(env.HUBSPOT_ACCESS_TOKEN)
      console.log("---------")
      const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`HubSpot update error: ${updateResponse.status}`);
      }
      
      const result = await updateResponse.json();
      console.log(`Successfully updated HubSpot contact: ${contactData.email}`);
      return result;
    } else {
      throw new Error('Contact not found in search results');
    }
    
  } catch (error) {
    console.error('Error updating HubSpot contact:', error);
    throw error;
  }
}

/**
 * Main request handler
 */
async function handleRequest(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS || '';
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCors(request, env);
  }
  
  // Check if origin is allowed
  if (!isOriginAllowed(origin, allowedOrigins)) {
    return new Response('Origin not allowed', { 
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Handle POST requests to create contacts
  if (request.method === 'POST' && new URL(request.url).pathname === '/contacts') {
    try {
      const contactData = await request.json();
      
      // Validate the contact data
      const validationErrors = validateContactData(contactData);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            ...corsHeaders,
          },
        });
      }
      
      // Create the contact in HubSpot
      const result = await createHubSpotContact(contactData, env);
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Contact created successfully',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          ...corsHeaders,
        },
      });
      
    } catch (error) {
      console.error('Error handling contact creation:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create contact',
        message: error.message,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          ...corsHeaders,
        },
      });
    }
  }
  
  // Handle health check
  if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'CoSpark HubSpot Proxy',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        ...corsHeaders,
      },
    });
  }
  
  // Handle unknown routes
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'Available endpoints: POST /contacts, GET /health',
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      ...corsHeaders,
    },
  });
}

// Export the main handler
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
}; 