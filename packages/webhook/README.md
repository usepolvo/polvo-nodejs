# @usepolvo/webhook

Generic webhook signature verification utilities.

## Install

```bash
pnpm add @usepolvo/webhook
```

## Usage

```typescript
import { verifyHmac } from "@usepolvo/webhook";

// Linear webhook (SHA256, no prefix)
const isValid = verifyHmac({
  payload: rawBody,
  signature: req.headers["linear-signature"],
  secret: process.env.WEBHOOK_SECRET,
});

// GitHub webhook (SHA256 with prefix)
const isValid = verifyHmac({
  payload: rawBody,
  signature: req.headers["x-hub-signature-256"],
  secret: process.env.GITHUB_SECRET,
  signaturePrefix: "sha256=",
});

// SHA1 algorithm
const isValid = verifyHmac({
  payload: rawBody,
  signature: req.headers["x-signature"],
  secret: process.env.SECRET,
  algorithm: "sha1",
});
```

## API

```typescript
function verifyHmac(options: {
  payload: string | Buffer;
  signature: string;
  secret: string;
  algorithm?: "sha256" | "sha1"; // default: 'sha256'
  signaturePrefix?: string; // e.g., 'sha256=' for GitHub
}): boolean;
```

Uses timing-safe comparison to prevent timing attacks.

## License

MIT
