# @usepolvo/core

Lightweight HTTP client with retries and simple auth handlers.

## Install

```bash
pnpm add @usepolvo/core
```

## Usage

```typescript
import polvo, { auth } from "@usepolvo/core";

// Simple request
const response = await polvo.get("https://api.example.com/data");
console.log(response.data);

// With authentication
const session = polvo.create({
  baseURL: "https://api.example.com",
  auth: auth.bearer("your_token"),
  retry: true,
  timeout: 30000,
});

const users = await session.get("/users").then((r) => r.data);
```

## Auth Handlers

```typescript
import { auth } from "@usepolvo/core";

auth.bearer("token"); // Authorization: Bearer token
auth.apiKey("key", "X-API-Key"); // X-API-Key: key
auth.basic("user", "pass"); // Authorization: Basic base64(user:pass)
```

## API

### Module Functions

- `polvo.get(url, config?)` - GET request
- `polvo.post(url, data?, config?)` - POST request
- `polvo.put(url, data?, config?)` - PUT request
- `polvo.patch(url, data?, config?)` - PATCH request
- `polvo.delete(url, config?)` - DELETE request
- `polvo.create(config?)` - Create reusable session

### Config Options

```typescript
interface PolvoConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: AuthHandler;
  retry?:
    | boolean
    | { maxAttempts?: number; baseDelay?: number; maxDelay?: number };
}
```

## License

MIT
