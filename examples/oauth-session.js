import polvo, { auth } from 'polvo';

async function oauthSessionExample() {
  console.log('🐙 Polvo OAuth2 & Session Example\n');

  try {
    // 1. Simple bearer token authentication
    console.log('1. Bearer token authentication');
    const bearerAuth = auth.bearer('fake-token-for-demo');
    const authResponse = await polvo.get('https://httpbin.org/bearer', {
      auth: bearerAuth
    });
    console.log('Auth header sent:', authResponse.data.token);
    console.log('');

    // 2. API Key authentication
    console.log('2. API Key authentication');
    const apiKeyAuth = auth.apiKey('secret-key-123', 'X-API-Key');
    const apiKeyResponse = await polvo.get('https://httpbin.org/headers', {
      auth: apiKeyAuth
    });
    console.log('API Key header:', apiKeyResponse.data.headers['X-Api-Key']);
    console.log('');

    // 3. Session with base URL and retry
    console.log('3. Session with configuration');
    const session = polvo.create({
      baseURL: 'https://httpbin.org',
      headers: {
        'User-Agent': 'Polvo-Session-Example/1.0'
      },
      auth: auth.bearer('session-token'),
      retry: true,
      timeout: 10000
    });

    // Use session with relative URLs
    const sessionResponse = await session.get('/get?param=session-test');
    console.log('Session request with base URL:', sessionResponse.data.args);
    console.log('');

    // 4. Session with retry configuration
    console.log('4. Session with retry');
    const retrySession = polvo.create({
      baseURL: 'https://httpbin.org',
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000
      }
    });

    const retryResponse = await retrySession.get('/status/200');
    console.log('Retry session response:', retryResponse.status);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

// OAuth2 example (commented out as it requires real credentials)
async function oauth2Example() {
  console.log('\n🔐 OAuth2 Example (commented out - requires real credentials)\n');

  /*
  // This would work with real OAuth2 credentials
  const oauth = auth.oauth2({
    flow: 'client_credentials',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    tokenUrl: 'https://your-auth-server.com/oauth/token',
    tokenCache: './tokens.json', // Encrypted by default
    scopes: ['api:read', 'api:write']
  });

  const session = polvo.create({
    baseURL: 'https://your-api.com',
    auth: oauth,
    retry: true
  });

  // OAuth2 token will be automatically fetched and refreshed
  const protectedData = await session.get('/protected-endpoint');
  console.log('Protected data:', protectedData.data);
  */

  console.log('Example OAuth2 configuration shown in comments above');
}

// Run the examples
oauthSessionExample().then(() => {
  oauth2Example();
}); 