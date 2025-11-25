# Polvo 🐙

**Production-ready HTTP client with OAuth2 and retries built-in**

The missing layer between `fetch` and enterprise service meshes. Handle the hard parts of API integration without the complexity.

## 🚀 Quick Start

```bash
npm install @usepolvo/core
```

```javascript
import polvo from "@usepolvo/core";

// Simple as fetch
const response = await polvo.get("https://api.github.com/users/octocat");
console.log(response.data);

// With authentication
const response = await polvo.get("https://api.example.com/users", {
  auth: polvo.auth.bearer("your_token"),
});

// For production workloads, use a session
const session = polvo.create({
  baseURL: "https://api.example.com",
  auth: polvo.auth.oauth2({
    flow: "client_credentials",
    clientId: "your_id",
    clientSecret: "your_secret",
    tokenUrl: "https://auth.example.com/token",
  }),
  retry: true,
});

const data = await session.get("/protected").then((r) => r.data);
```

## 🎯 Why Polvo?

**Simple things stay simple:**

```javascript
// Just like fetch
const data = await polvo
  .get("https://api.example.com/data")
  .then((r) => r.data);
```

**Hard things become easy:**

```javascript
// OAuth2 with automatic token refresh
const session = polvo.create({
  baseURL: "https://api.example.com",
  auth: polvo.auth.oauth2({
    flow: "client_credentials",
    clientId: "your_id",
    clientSecret: "your_secret",
    tokenUrl: "https://auth.example.com/token",
    tokenCache: "~/.polvo/tokens.json", // Explicit, encrypted by default
  }),
  retry: true, // Exponential backoff by default
});
```

## 🔐 OAuth2 Done Right

The crown jewel - production-ready OAuth2 that actually works:

```javascript
import { auth } from "@usepolvo/core";

// Explicit token storage (encrypted by default)
const oauth = auth.oauth2({
  flow: "client_credentials",
  clientId: "your_id",
  clientSecret: "your_secret",
  tokenUrl: "https://auth.example.com/token",
  tokenCache: "~/.polvo/tokens.json", // You know where tokens live
  cacheEncryption: true, // Explicit choice
});

// Use it anywhere
const response = await polvo.get("https://api.example.com/data", {
  auth: oauth,
});

// Or in a session for connection pooling
const session = polvo.create({ auth: oauth });

// Use the session for multiple requests
const data = await session.get("/protected-data");
```

## 🛡️ Production Patterns Built-In

```javascript
// Everything configured in one place
const session = polvo.create({
  baseURL: "https://api.example.com",
  auth: polvo.auth.bearer("token"),

  // Retry configuration (sensible defaults)
  retry: true, // or retry: { maxAttempts: 5, baseDelay: 1000 }

  // Timeouts
  timeout: 30000, // 30 seconds
});
```

## 🔧 Common Patterns

### Simple One-off Requests

```javascript
import polvo from "@usepolvo/core";

// GET
const data = await polvo
  .get("https://api.example.com/users")
  .then((r) => r.data);

// POST with JSON
const response = await polvo.post("https://api.example.com/users", {
  name: "Alice",
  email: "alice@example.com",
});

// With headers
const response = await polvo.get("https://api.example.com/data", {
  headers: { "X-API-Key": "secret" },
});

// Basic auth (username/password tuple like requests)
const response = await polvo.get(url, {
  auth: polvo.auth.basic("username", "password"),
});
```

### Production Sessions

```javascript
// Configure once, use everywhere
const session = polvo.create({
  baseURL: "https://api.example.com",
  headers: { "User-Agent": "MyApp/1.0" },
  auth: polvo.auth.bearer("token"),
  retry: true,
});

// Clean URLs - no leading slash needed
const users = await session.get("users").then((r) => r.data);
const user = await session.get(`users/${userId}`).then((r) => r.data);

// Full URL still works
const response = await session.get("https://other-api.com/data");
```

### Authentication Patterns

```javascript
import { auth } from "@usepolvo/core";

// Bearer tokens (most common)
const bearerAuth = auth.bearer("your_token");

// OAuth2 Client Credentials
const oauth = auth.oauth2({
  flow: "client_credentials",
  clientId: "id",
  clientSecret: "secret",
  tokenUrl: "https://auth.example.com/token",
});

// OAuth2 with refresh tokens
const oauthWithRefresh = auth.oauth2({
  flow: "authorization_code",
  clientId: "id",
  clientSecret: "secret",
  tokenUrl: "https://auth.example.com/token",
  refreshToken: "your_refresh_token",
});

// API Key
const apiKeyAuth = auth.apiKey("key123", "X-API-Key");

// Custom auth class
class CustomAuth extends auth.AuthBase {
  async apply(config) {
    config.headers = {
      ...config.headers,
      "X-Custom": "value",
    };
    return config;
  }
}
```

### Advanced Configuration

```javascript
import { storage } from "@usepolvo/core";

// Fine-grained control when you need it
const session = polvo.create({
  // Retry configuration
  retry: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 60000,
  },

  // Custom storage backend
  auth: auth.oauth2({
    // ... oauth config
    tokenCache: storage.encryptedFile("./app-tokens.json"),
  }),
});
```

## 🏗️ Design Principles

1. **Fetch compatibility**: Built on native fetch, works everywhere
2. **Progressive disclosure**: Simple by default, powerful when needed
3. **Explicit > Implicit**: You control where tokens are stored
4. **Production-first**: Secure defaults, sensible retries
5. **Zero dependencies**: Core has no dependencies

## 🔄 Migration from other libraries

### From fetch

```javascript
// Before (fetch)
const response = await fetch("https://api.example.com/data", {
  headers: { Authorization: "Bearer token" },
});
const data = await response.json();

// After (polvo) - it's the same but with more features!
const response = await polvo.get("https://api.example.com/data", {
  auth: polvo.auth.bearer("token"),
});
const data = response.data; // Auto-parsed JSON
```

### From axios

```javascript
// Before (axios)
import axios from "axios";
const response = await axios.get("https://api.example.com/data");

// After (polvo) - nearly identical!
import polvo from "@usepolvo/core";
const response = await polvo.get("https://api.example.com/data");

// Axios instances
const api = axios.create({ baseURL: "https://api.example.com" });

// Polvo sessions
const api = polvo.create({ baseURL: "https://api.example.com" });
```

## 📚 API Reference

### Module Functions

- `polvo.get(url, config?)` - GET request
- `polvo.post(url, data?, config?)` - POST request
- `polvo.put(url, data?, config?)` - PUT request
- `polvo.patch(url, data?, config?)` - PATCH request
- `polvo.delete(url, config?)` - DELETE request
- `polvo.head(url, config?)` - HEAD request
- `polvo.options(url, config?)` - OPTIONS request
- `polvo.create(config?)` - Create new session

### Session Class

```javascript
const session = new polvo.Session(config);
// Same methods as module functions
// Configured with auth, retry, and other options
```

### Authentication

```javascript
import { auth } from "@usepolvo/core";

auth.bearer(token)
auth.basic(username, password)
auth.apiKey(key, headerName?)
auth.oauth2(config)
```

### Storage

```javascript
import { storage } from "@usepolvo/core";

storage.encryptedFile(path); // Default: ~/.polvo/tokens.json
storage.plainFile(path); // Not recommended for production
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
