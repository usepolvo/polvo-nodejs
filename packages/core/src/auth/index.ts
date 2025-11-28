/// <reference lib="dom" />

import { AuthHandler, PolvoRequestConfig } from "../types.js";

export abstract class AuthBase implements AuthHandler {
  abstract apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig>;
}

export class BearerAuth extends AuthBase {
  constructor(private token: string) {
    super();
  }

  async apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig> {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${this.token}`,
    };
    return config;
  }
}

export class ApiKeyAuth extends AuthBase {
  constructor(
    private apiKey: string,
    private headerName: string = "X-API-Key"
  ) {
    super();
  }

  async apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig> {
    config.headers = {
      ...config.headers,
      [this.headerName]: this.apiKey,
    };
    return config;
  }
}

export class BasicAuth extends AuthBase {
  constructor(
    private username: string,
    private password: string
  ) {
    super();
  }

  async apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig> {
    const credentials = btoa(`${this.username}:${this.password}`);
    config.headers = {
      ...config.headers,
      Authorization: `Basic ${credentials}`,
    };
    return config;
  }
}

// Convenience factory functions
export function bearer(token: string): BearerAuth {
  return new BearerAuth(token);
}

export function apiKey(key: string, headerName?: string): ApiKeyAuth {
  return new ApiKeyAuth(key, headerName);
}

export function basic(username: string, password: string): BasicAuth {
  return new BasicAuth(username, password);
}

// OAuth2
export {
  OAuth2Auth,
  OAuth2Config,
  OAuth2Tokens,
  TokenStorage,
  oauth2,
  memoryStorage,
} from "./oauth2.js";
