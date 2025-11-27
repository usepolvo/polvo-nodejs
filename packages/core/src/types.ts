/// <reference lib="dom" />

export interface PolvoConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: AuthHandler;
  retry?: boolean | RetryConfig;
  json?: any;
  data?: any;
  params?: Record<string, string>;
}

export interface PolvoRequestConfig extends PolvoConfig {
  method: string;
  url: string;
}

export interface PolvoResponse extends Response {
  data?: any;
  config: PolvoRequestConfig;
}

export interface AuthHandler {
  apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig>;
}

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export interface PolvoError extends Error {
  config?: PolvoRequestConfig;
  response?: Response;
  code?: string;
}

export class PolvoHTTPError extends Error implements PolvoError {
  constructor(
    message: string,
    public config?: PolvoRequestConfig,
    public response?: Response,
    public code?: string
  ) {
    super(message);
    this.name = "PolvoHTTPError";
  }
}
