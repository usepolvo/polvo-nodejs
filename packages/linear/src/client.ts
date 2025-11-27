import { create, type Session } from "@usepolvo/core";

const LINEAR_API_URL = "https://api.linear.app/graphql";

export interface LinearClientConfig {
  /** Your Linear API access token (personal API key or OAuth token) */
  accessToken: string;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Error thrown when Linear API requests fail
 */
export class LinearApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly graphqlErrors?: GraphQLResponse["errors"]
  ) {
    super(message);
    this.name = "LinearApiError";
  }
}

/**
 * Linear GraphQL client for direct API access
 *
 * @example
 * ```ts
 * const client = new LinearClient({ accessToken: process.env.LINEAR_TOKEN });
 *
 * const result = await client.query<{ issue: { title: string } }>(
 *   `query GetIssue($id: String!) { issue(id: $id) { title } }`,
 *   { id: 'issue-123' }
 * );
 * console.log(result.issue.title);
 * ```
 */
export class LinearClient {
  private session: Session;

  constructor(config: LinearClientConfig) {
    this.session = create({
      baseURL: LINEAR_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
    });
  }

  /**
   * Execute a GraphQL query or mutation
   */
  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const response = await this.session.post("", { query, variables });

    const result = response.data as GraphQLResponse<T>;

    if (result.errors && result.errors.length > 0) {
      throw new LinearApiError(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`,
        undefined,
        result.errors
      );
    }

    if (!result.data) {
      throw new LinearApiError("No data returned from Linear API");
    }

    return result.data;
  }
}
