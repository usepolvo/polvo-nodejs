import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Common schemas
// ─────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
  url: z.string().optional(),
});

export const TeamSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
});

export const StateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  color: z.string().optional(),
});

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

export const CommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  userId: z.string(),
  issueId: z.string(),
});

// ─────────────────────────────────────────────────────────────
// Issue webhook
// ─────────────────────────────────────────────────────────────

export const IssueDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  priority: z.number(),
  url: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  state: StateSchema.optional(),
  team: TeamSchema.optional(),
  creator: UserSchema.optional(),
  assignee: UserSchema.nullable().optional(),
  labels: z.array(LabelSchema).optional(),
});

export const IssueWebhookSchema = z.object({
  type: z.literal("Issue"),
  action: z.enum(["create", "update", "remove"]),
  createdAt: z.string(),
  organizationId: z.string(),
  webhookTimestamp: z.number().optional(),
  webhookId: z.string().optional(),
  data: IssueDataSchema,
});

// ─────────────────────────────────────────────────────────────
// Agent Session webhook
// ─────────────────────────────────────────────────────────────

export const AgentSessionIssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  teamId: z.string(),
  team: TeamSchema,
  identifier: z.string(),
  url: z.string(),
  description: z.string().optional(),
});

export const AgentSessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().nullable().optional(),
  creatorId: z.string(),
  appUserId: z.string().optional(),
  commentId: z.string().optional(),
  sourceCommentId: z.string().nullable().optional(),
  issueId: z.string(),
  status: z.string(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  dismissedAt: z.string().nullable().optional(),
  dismissedById: z.string().nullable().optional(),
  type: z.string(),
  externalLink: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  sourceMetadata: z.unknown().nullable().optional(),
  plan: z.unknown().nullable().optional(),
  organizationId: z.string().optional(),
  creator: UserSchema,
  comment: CommentSchema,
  issue: AgentSessionIssueSchema,
});

export const AgentSessionWebhookSchema = z.object({
  type: z.literal("AgentSessionEvent"),
  action: z.enum(["created", "updated"]),
  createdAt: z.string(),
  organizationId: z.string(),
  oauthClientId: z.string().optional(),
  appUserId: z.string().optional(),
  webhookTimestamp: z.number().optional(),
  webhookId: z.string().optional(),
  agentSession: AgentSessionSchema,
  previousComments: z.array(CommentSchema).optional(),
  guidance: z.unknown().nullable().optional(),
});

// ─────────────────────────────────────────────────────────────
// Agent Activity webhook
// ─────────────────────────────────────────────────────────────

export const AgentActivityContentSchema = z.object({
  type: z.enum([
    "prompt",
    "thought",
    "action",
    "response",
    "error",
    "elicitation",
  ]),
  body: z.string().optional(),
  action: z.string().optional(),
  parameter: z.string().optional(),
  result: z.string().optional(),
});

export const AgentActivitySchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  agentSessionId: z.string(),
  content: AgentActivityContentSchema,
});

export const AgentActivityWebhookSchema = z.object({
  type: z.literal("AgentActivity"),
  action: z.string(),
  createdAt: z.string(),
  organizationId: z.string(),
  webhookTimestamp: z.number().optional(),
  webhookId: z.string().optional(),
  agentActivity: AgentActivitySchema,
  agentSession: AgentSessionSchema,
});

// ─────────────────────────────────────────────────────────────
// Comment webhook
// ─────────────────────────────────────────────────────────────

export const CommentDataSchema = CommentSchema.extend({
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  user: UserSchema.optional(),
});

export const CommentWebhookSchema = z.object({
  type: z.literal("Comment"),
  action: z.enum(["create", "update", "remove"]),
  createdAt: z.string(),
  organizationId: z.string(),
  webhookTimestamp: z.number().optional(),
  webhookId: z.string().optional(),
  data: CommentDataSchema,
});

// ─────────────────────────────────────────────────────────────
// Union type for all webhooks
// ─────────────────────────────────────────────────────────────

export const LinearWebhookSchema = z.discriminatedUnion("type", [
  IssueWebhookSchema,
  AgentSessionWebhookSchema,
  AgentActivityWebhookSchema,
  CommentWebhookSchema,
]);

// ─────────────────────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────────────────────

export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type State = z.infer<typeof StateSchema>;
export type Label = z.infer<typeof LabelSchema>;
export type Comment = z.infer<typeof CommentSchema>;

export type IssueData = z.infer<typeof IssueDataSchema>;
export type IssueWebhook = z.infer<typeof IssueWebhookSchema>;

export type AgentSession = z.infer<typeof AgentSessionSchema>;
export type AgentSessionWebhook = z.infer<typeof AgentSessionWebhookSchema>;

export type AgentActivityContent = z.infer<typeof AgentActivityContentSchema>;
export type AgentActivity = z.infer<typeof AgentActivitySchema>;
export type AgentActivityWebhook = z.infer<typeof AgentActivityWebhookSchema>;

export type CommentData = z.infer<typeof CommentDataSchema>;
export type CommentWebhook = z.infer<typeof CommentWebhookSchema>;

export type LinearWebhook = z.infer<typeof LinearWebhookSchema>;
