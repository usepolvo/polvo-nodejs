/// <reference lib="dom" />

import { AuthHandler, PolvoRequestConfig, OAuth2Config, TokenStorage, TokenRefreshError } from '../types.js';
import { FileStorage } from '../storage/FileStorage.js';

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
        private headerName: string = 'X-API-Key'
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
    constructor(private username: string, private password: string) {
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

interface OAuth2TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
}

interface StoredToken {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    tokenType: string;
    scope?: string;
}

export class OAuth2 extends AuthBase {
    private storage: TokenStorage;
    private storageKey: string;
    private refreshPromise?: Promise<string>;

    constructor(private config: OAuth2Config) {
        super();

        // Initialize storage with defaults and warnings
        if (typeof config.tokenCache === 'string') {
            this.storage = new FileStorage(config.tokenCache, config.cacheEncryption !== false);
            this.storageKey = 'oauth2_token';
        } else if (config.tokenCache) {
            this.storage = config.tokenCache;
            this.storageKey = 'oauth2_token';
        } else {
            // Default to encrypted file storage
            this.storage = new FileStorage('~/.polvo/tokens.json', true);
            this.storageKey = `oauth2_${config.clientId}`;

            // Warn about default storage for production awareness
            if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
                console.warn(
                    '[Polvo] Using default token storage (~/.polvo/tokens.json). ' +
                    'For production, explicitly specify tokenCache path.'
                );
            }
        }
    }

    async apply(config: PolvoRequestConfig): Promise<PolvoRequestConfig> {
        const token = await this._getValidToken();
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
        return config;
    }

    private async _getValidToken(): Promise<string> {
        // Check if we have a valid cached token
        const cachedToken = await this._getCachedToken();
        if (cachedToken && this._isTokenValid(cachedToken)) {
            return cachedToken.accessToken;
        }

        // If we have a refresh token, try to refresh
        if (cachedToken?.refreshToken && this.config.flow === 'authorization_code') {
            return this._refreshToken(cachedToken.refreshToken);
        }

        // Otherwise, get a new token
        return this._fetchNewToken();
    }

    private async _getCachedToken(): Promise<StoredToken | null> {
        try {
            const tokenData = await this.storage.get(this.storageKey);
            if (!tokenData) return null;
            return JSON.parse(tokenData);
        } catch {
            return null;
        }
    }

    private _isTokenValid(token: StoredToken): boolean {
        // Add 5 minute buffer for token expiration
        const bufferMs = 5 * 60 * 1000;
        return Date.now() < (token.expiresAt - bufferMs);
    }

    private async _refreshToken(refreshToken: string): Promise<string> {
        // Prevent multiple concurrent refresh attempts
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this._doRefreshToken(refreshToken);

        try {
            const token = await this.refreshPromise;
            return token;
        } finally {
            this.refreshPromise = undefined;
        }
    }

    private async _doRefreshToken(refreshToken: string): Promise<string> {
        const tokenData = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
        });

        try {
            const response = await fetch(this.config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenData,
            });

            if (!response.ok) {
                throw new TokenRefreshError(
                    `Token refresh failed: ${response.status}`,
                    `HTTP ${response.status}`
                );
            }

            const tokenResponse: OAuth2TokenResponse = await response.json();
            await this._storeToken(tokenResponse);
            return tokenResponse.access_token;
        } catch (error) {
            throw new TokenRefreshError(
                'Failed to refresh OAuth2 token',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    private async _fetchNewToken(): Promise<string> {
        let tokenData: URLSearchParams;

        switch (this.config.flow) {
            case 'client_credentials':
                tokenData = new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                });
                if (this.config.scopes) {
                    tokenData.set('scope', this.config.scopes.join(' '));
                }
                break;

            case 'authorization_code':
                if (!this.config.refreshToken) {
                    throw new TokenRefreshError(
                        'Authorization code flow requires a refresh token',
                        'MISSING_REFRESH_TOKEN'
                    );
                }
                return this._refreshToken(this.config.refreshToken);

            case 'password':
                throw new TokenRefreshError(
                    'Password flow is not supported for security reasons',
                    'UNSUPPORTED_FLOW'
                );

            default:
                throw new TokenRefreshError(
                    `Unsupported OAuth2 flow: ${this.config.flow}`,
                    'UNSUPPORTED_FLOW'
                );
        }

        try {
            const response = await fetch(this.config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenData,
            });

            if (!response.ok) {
                throw new TokenRefreshError(
                    `Token request failed: ${response.status}`,
                    `HTTP ${response.status}`
                );
            }

            const tokenResponse: OAuth2TokenResponse = await response.json();
            await this._storeToken(tokenResponse);
            return tokenResponse.access_token;
        } catch (error) {
            throw new TokenRefreshError(
                'Failed to fetch OAuth2 token',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    private async _storeToken(tokenResponse: OAuth2TokenResponse): Promise<void> {
        const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);

        const storedToken: StoredToken = {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt,
            tokenType: tokenResponse.token_type,
            scope: tokenResponse.scope,
        };

        await this.storage.set(this.storageKey, JSON.stringify(storedToken));
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

export function oauth2(config: OAuth2Config): OAuth2 {
    return new OAuth2(config);
} 