/// <reference lib="dom" />

import { createHash, randomBytes } from "node:crypto";
import { AuthHandler, PolvoRequestConfig } from "../types.js";

export interface OAuth2Config {
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes?: string[];
  usePKCE?: boolean;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface TokenStorage {
  get(): Promise<OAuth2Tokens | null>;
  set(tokens: OAuth2Tokens): Promise<void>;
  clear(): Promise<void>;
}

export class OAuth2Auth implements AuthHandler {
  private config: OAuth2Config;
  private storage: TokenStorage;

  constructor(config: OAuth2Config, storage?: TokenStorage) {
    this.config = config;
    this.storage = storage || memoryStorage();
  }

  private get usePKCE(): boolean {
    return this.config.usePKCE ?? !this.config.clientSecret;
  }

  getAuthorizationUrl(state?: string): { url: string; codeVerifier?: string } {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
    });

    if (this.config.scopes?.length) {
      params.set("scope", this.config.scopes.join(" "));
    }
    if (state) {
      params.set("state", state);
    }

    let codeVerifier: string | undefined;
    if (this.usePKCE) {
      codeVerifier = this.generateCodeVerifier();
      const codeChallenge = this.generateCodeChallenge(codeVerifier);
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }

    return {
      url: `${this.config.authorizationUrl}?${params}`,
      codeVerifier,
    };
  }

  async exchangeCode(
    code: string,
    codeVerifier?: string
  ): Promise<OAuth2Tokens> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
    });

    if (this.config.clientSecret) {
      body.set("client_secret", this.config.clientSecret);
    }
    if (codeVerifier) {
      body.set("code_verifier", codeVerifier);
    }

    return this.fetchTokens(body);
  }

  async refreshTokens(): Promise<OAuth2Tokens> {
    const tokens = await this.storage.get();
    if (!tokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      body.set("client_secret", this.config.clientSecret);
    }

    return this.fetchTokens(body);
  }

  async hasValidTokens(): Promise<boolean> {
    const tokens = await this.storage.get();
    if (!tokens) return false;
    if (!tokens.expiresAt) return true;
    return Date.now() < tokens.expiresAt - 60000;
  }

  async apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig> {
    let tokens = await this.storage.get();

    // Auto-refresh if expired
    if (tokens?.expiresAt && Date.now() >= tokens.expiresAt - 60000) {
      if (tokens.refreshToken) {
        tokens = await this.refreshTokens();
      } else {
        tokens = null;
      }
    }

    if (tokens) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${tokens.accessToken}`,
      };
    }

    return config;
  }

  private async fetchTokens(body: URLSearchParams): Promise<OAuth2Tokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth2 token request failed: ${error}`);
    }

    const data = await response.json();
    const tokens: OAuth2Tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
    };

    await this.storage.set(tokens);
    return tokens;
  }

  private generateCodeVerifier(): string {
    return randomBytes(32).toString("base64url");
  }

  private generateCodeChallenge(verifier: string): string {
    return createHash("sha256").update(verifier).digest("base64url");
  }
}

export function memoryStorage(): TokenStorage {
  let tokens: OAuth2Tokens | null = null;
  return {
    get: async () => tokens,
    set: async (t) => {
      tokens = t;
    },
    clear: async () => {
      tokens = null;
    },
  };
}

export function oauth2(
  config: OAuth2Config,
  storage?: TokenStorage
): OAuth2Auth {
  return new OAuth2Auth(config, storage);
}
