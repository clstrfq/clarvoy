export * from "./models/auth";
export * from "./models/chat";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

// Decisions
export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Grant, Strategy, Hiring, etc.
  status: text("status").notNull().default("draft"), // draft, open, closed, archived
  deadline: timestamp("deadline"),
  authorId: varchar("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // For consensus tracking
  consensusreached: boolean("consensus_reached").default(false),
  outcome: text("outcome"), // Approved, Rejected, etc.
});

// Judgments (Blind inputs)
export const judgments = pgTable("judgments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(), // 1-10
  rationale: text("rationale").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Comments / Debate
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attachments
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").references(() => decisions.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  objectPath: text("object_path").notNull(),
  extractedText: text("extracted_text"),
  context: text("context").notNull().default("decision"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const decisionsRelations = relations(decisions, ({ one, many }) => ({
  author: one(users, {
    fields: [decisions.authorId],
    references: [users.id],
  }),
  judgments: many(judgments),
  comments: many(comments),
  attachments: many(attachments),
}));

export const judgmentsRelations = relations(judgments, ({ one }) => ({
  decision: one(decisions, {
    fields: [judgments.decisionId],
    references: [decisions.id],
  }),
  user: one(users, {
    fields: [judgments.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  decision: one(decisions, {
    fields: [comments.decisionId],
    references: [decisions.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  decision: one(decisions, {
    fields: [attachments.decisionId],
    references: [decisions.id],
  }),
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertDecisionSchema = createInsertSchema(decisions).omit({ id: true, createdAt: true, updatedAt: true, authorId: true });
export const insertJudgmentSchema = createInsertSchema(judgments).omit({ id: true, submittedAt: true, userId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, userId: true, isAiGenerated: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true, userId: true, extractedText: true });

// Types
export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Judgment = typeof judgments.$inferSelect;
export type InsertJudgment = z.infer<typeof insertJudgmentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

// API Types
export type CreateDecisionRequest = InsertDecision;
export type UpdateDecisionRequest = Partial<InsertDecision>;
export type CreateJudgmentRequest = InsertJudgment;
export type CreateCommentRequest = InsertComment;

export interface DecisionWithDetails extends Decision {
  author?: typeof users.$inferSelect;
  judgments?: Judgment[];
  comments?: Comment[];
}
