/// <reference lib="dom" />

import {
    PolvoConfig,
    PolvoRequestConfig,
    PolvoResponse,
    PolvoHTTPError
} from './types.js';

export class Session {
    public defaults: PolvoConfig;



    constructor(config: PolvoConfig = {}) {
        this.defaults = {
            timeout: 30000,
            headers: {
                'User-Agent': 'polvo/1.0.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            ...config,
        };


    }

    async request(method: string, url: string, config: PolvoConfig = {}): Promise<PolvoResponse> {
        let requestConfig: PolvoRequestConfig = {
            ...this.defaults,
            ...config,
            method: method.toUpperCase(),
            url: this._buildURL(url, config.baseURL || this.defaults.baseURL),
            headers: {
                ...this.defaults.headers,
                ...config.headers,
            },
        };





        // Prepare fetch options
        const fetchOptions: RequestInit = {
            method: requestConfig.method,
            headers: requestConfig.headers,
            signal: this._createAbortSignal(requestConfig.timeout),
        };

        // Handle request body
        if (requestConfig.json) {
            fetchOptions.body = JSON.stringify(requestConfig.json);
        } else if (requestConfig.data) {
            fetchOptions.body = requestConfig.data;
        }

        // Apply authentication if configured
        if (requestConfig.auth) {
            requestConfig = await requestConfig.auth.apply(requestConfig);
        }

        // Add query parameters
        const finalUrl = this._addQueryParams(requestConfig.url, requestConfig.params);

        try {
            // Make the actual request with retry logic
            let response = await this._makeRequestWithRetry(finalUrl, fetchOptions, requestConfig) as PolvoResponse;

            // Attach config to response
            response.config = requestConfig;

            // Auto-parse JSON if content-type indicates JSON
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json') && !response.bodyUsed) {
                try {
                    response.data = await response.json();
                } catch {
                    // Ignore JSON parse errors
                }
            }



            // Check for HTTP errors (like Axios)
            if (!response.ok) {
                throw new PolvoHTTPError(
                    `Request failed with status ${response.status}`,
                    requestConfig,
                    response,
                    `HTTP_${response.status}`
                );
            }

            return response;

        } catch (error) {
            if (error instanceof PolvoHTTPError) {
                throw error;
            }

            // Handle other errors (network, timeout, etc.)
            throw new PolvoHTTPError(
                error instanceof Error ? error.message : 'Request failed',
                requestConfig,
                undefined,
                'NETWORK_ERROR'
            );
        }
    }

    // Convenience methods
    async get(url: string, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('GET', url, config);
    }

    async post(url: string, data?: any, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('POST', url, { ...config, json: data });
    }

    async put(url: string, data?: any, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('PUT', url, { ...config, json: data });
    }

    async patch(url: string, data?: any, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('PATCH', url, { ...config, json: data });
    }

    async delete(url: string, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('DELETE', url, config);
    }

    async head(url: string, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('HEAD', url, config);
    }

    async options(url: string, config?: PolvoConfig): Promise<PolvoResponse> {
        return this.request('OPTIONS', url, config);
    }





    private _buildURL(url: string, baseURL?: string): string {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        if (baseURL) {
            return new URL(url, baseURL).href;
        }

        return url;
    }

    private _addQueryParams(url: string, params?: Record<string, string>): string {
        if (!params) return url;

        const urlObj = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
            urlObj.searchParams.set(key, value);
        });

        return urlObj.href;
    }

    private _createAbortSignal(timeout?: number): AbortSignal | undefined {
        if (!timeout) return undefined;

        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeout);
        return controller.signal;
    }

    private async _makeRequestWithRetry(
        url: string,
        fetchOptions: RequestInit,
        config: PolvoRequestConfig
    ): Promise<Response> {
        const retryConfig = this._getRetryConfig(config.retry);
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
            try {
                const response = await fetch(url, fetchOptions);

                // Check if we should retry based on status code
                if (this._shouldRetryResponse(response, retryConfig) && attempt < retryConfig.maxAttempts) {
                    await this._delay(attempt, retryConfig);
                    continue;
                }

                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                if (attempt < retryConfig.maxAttempts) {
                    await this._delay(attempt, retryConfig);
                    continue;
                }

                throw error;
            }
        }

        throw lastError || new Error('Max retry attempts exceeded');
    }

    private _getRetryConfig(retry?: boolean | any) {
        if (!retry) {
            return { maxAttempts: 1, baseDelay: 1000, maxDelay: 30000 };
        }

        if (retry === true) {
            return { maxAttempts: 3, baseDelay: 1000, maxDelay: 30000 };
        }

        return {
            maxAttempts: retry.maxAttempts || 3,
            baseDelay: retry.baseDelay || 1000,
            maxDelay: retry.maxDelay || 30000,
        };
    }

    private _shouldRetryResponse(response: Response, retryConfig: any): boolean {
        // Retry on server errors and too many requests
        return response.status >= 500 || response.status === 429;
    }

    private async _delay(attempt: number, retryConfig: any): Promise<void> {
        let delay = Math.min(
            retryConfig.baseDelay * Math.pow(2, attempt - 1),
            retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        delay = delay * (0.5 + Math.random() * 0.5);

        return new Promise(resolve => setTimeout(resolve, delay));
    }


} 