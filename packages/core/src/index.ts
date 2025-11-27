/// <reference lib="dom" />

import { Session } from "./Session.js";
import { PolvoConfig, PolvoResponse } from "./types.js";

// Create a default session for module-level functions
const defaultSession = new Session();

// Module-level convenience functions (like requests library)
export async function request(
  method: string,
  url: string,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.request(method, url, config);
}

export async function get(
  url: string,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.get(url, config);
}

export async function post(
  url: string,
  data?: any,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.post(url, data, config);
}

export async function put(
  url: string,
  data?: any,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.put(url, data, config);
}

export async function patch(
  url: string,
  data?: any,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.patch(url, data, config);
}

export async function del(
  url: string,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.delete(url, config);
}

export async function head(
  url: string,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.head(url, config);
}

export async function options(
  url: string,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  return defaultSession.options(url, config);
}

// Factory function for creating sessions (like Axios.create())
export function create(config?: PolvoConfig): Session {
  return new Session(config);
}

// Interface for polvo function config
interface PolvoFunctionConfig extends PolvoConfig {
  method?: string;
  url?: string;
}

// Default export function (Axios-style)
async function polvo(
  configOrUrl: string | PolvoFunctionConfig,
  config?: PolvoConfig
): Promise<PolvoResponse> {
  if (typeof configOrUrl === "string") {
    // polvo(url, config) - assume GET
    return get(configOrUrl, config);
  }

  // polvo(config)
  const { method = "GET", url, ...restConfig } = configOrUrl;
  if (!url) {
    throw new Error("URL is required");
  }

  return request(method, url, restConfig);
}

// Attach methods to default export (Axios-style)
polvo.request = request;
polvo.get = get;
polvo.post = post;
polvo.put = put;
polvo.patch = patch;
polvo.delete = del;
polvo.head = head;
polvo.options = options;
polvo.create = create;

// Session class export
export { Session };

// Re-export all types
export * from "./types.js";

// Re-export auth module
export * as auth from "./auth/index.js";

// Default export
export default polvo;
