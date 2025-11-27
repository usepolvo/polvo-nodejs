import { LinearClient } from "@usepolvo/linear";

async function linearClientExample() {
  console.log("Linear Client Example\n");

  // Initialize client with your token
  const client = new LinearClient({
    accessToken: process.env.LINEAR_TOKEN || "your-token-here",
  });

  try {
    // Query issues assigned to you
    console.log("1. Query viewer's issues");
    const myIssues = await client.query(`
      query {
        viewer {
          assignedIssues(first: 5) {
            nodes {
              id
              title
              state { name }
            }
          }
        }
      }
    `);
    console.log("Your issues:", myIssues.viewer?.assignedIssues?.nodes);
    console.log("");

    // Query a specific issue
    console.log("2. Query specific issue");
    const issue = await client.query(
      `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
          description
          state { name }
          team { name }
          assignee { name }
        }
      }
    `,
      { id: "your-issue-id" }
    );
    console.log("Issue:", issue.issue);
    console.log("");

    // Create an issue
    console.log("3. Create issue (example mutation)");
    const createResult = await client.query(
      `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            title
            url
          }
        }
      }
    `,
      {
        input: {
          teamId: "your-team-id",
          title: "New issue from Polvo",
          description: "Created via @usepolvo/linear",
        },
      }
    );
    console.log("Created:", createResult.issueCreate);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes("401")) {
      console.log("\nHint: Set LINEAR_TOKEN environment variable");
    }
  }
}

// Requires LINEAR_TOKEN to be set
if (!process.env.LINEAR_TOKEN) {
  console.log("Set LINEAR_TOKEN environment variable to run this example:");
  console.log("  LINEAR_TOKEN=lin_api_xxx node linear-client.js\n");
}

linearClientExample();
