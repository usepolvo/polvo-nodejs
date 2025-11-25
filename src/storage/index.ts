import { FileStorage } from "./FileStorage.js";

export { FileStorage };

// Re-export types
export type { TokenStorage } from "../types.js";

// Convenience function for encrypted file storage
export function encryptedFile(
  path: string = "~/.polvo/tokens.json"
): FileStorage {
  return new FileStorage(path, true);
}

// Convenience function for plain file storage (not recommended for production)
export function plainFile(path: string): FileStorage {
  return new FileStorage(path, false);
}
