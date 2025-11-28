import { auth } from "@usepolvo/core";
import { LinearClient } from "@usepolvo/linear";

const {
  LINEAR_CLIENT_ID,
  LINEAR_CLIENT_SECRET,
  LINEAR_REDIRECT_URI = "http://localhost:3000/callback",
  LINEAR_CODE,
} = process.env;

if (!LINEAR_CLIENT_ID) {
  console.log("Set LINEAR_CLIENT_ID in .env to run this example\n");
  console.log("Create an OAuth app at: https://linear.app/settings/api/applications");
  process.exit(1);
}

// Configure OAuth2 for Linear (force PKCE for security)
const oauth = auth.oauth2({
  clientId: LINEAR_CLIENT_ID,
  clientSecret: LINEAR_CLIENT_SECRET,
  authorizationUrl: "https://linear.app/oauth/authorize",
  tokenUrl: "https://api.linear.app/oauth/token",
  redirectUri: LINEAR_REDIRECT_URI,
  scopes: ["read", "write"],
  usePKCE: true,
});

// If we have a code, exchange it
if (LINEAR_CODE) {
  const verifier = process.env.LINEAR_VERIFIER;
  if (!verifier) {
    console.error("LINEAR_VERIFIER is required when exchanging code");
    process.exit(1);
  }

  try {
    const tokens = await oauth.exchangeCode(LINEAR_CODE, verifier);
    console.log("Success! Add this to your .env:\n");
    console.log(`LINEAR_TOKEN=${tokens.accessToken}\n`);

    // Quick verification
    const client = new LinearClient({ accessToken: tokens.accessToken });
    const result = await client.query("{ viewer { name email } }");
    console.log("Logged in as:", result.viewer?.name);
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

// Step 1: Generate auth URL
const { url, codeVerifier } = oauth.getAuthorizationUrl();
console.log("1. Open this URL:\n");
console.log(`   ${url}\n`);
console.log("2. After authorizing, copy the code from the redirect URL and run:\n");
console.log(`   LINEAR_CODE=<code> LINEAR_VERIFIER=${codeVerifier} node --env-file=.env linear-auth.js\n`);
