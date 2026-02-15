import { db } from "./db";
import {
  decisions, judgments, comments, auditLogs, attachments,
  type Decision, type InsertDecision,
  type Judgment, type InsertJudgment,
  type Comment, type InsertComment,
  type AuditLog, type Attachment, type InsertAttachment
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Decisions
  getDecisions(): Promise<Decision[]>;
  getDecision(id: number): Promise<Decision | undefined>;
  createDecision(decision: InsertDecision & { authorId?: string | null }): Promise<Decision>;
  updateDecision(id: number, decision: Partial<InsertDecision>): Promise<Decision>;
  deleteDecision(id: number): Promise<void>;

  // Judgments
  createJudgment(judgment: InsertJudgment & { userId: string }): Promise<Judgment>;
  getJudgments(decisionId: number): Promise<Judgment[]>;
  getUserJudgment(decisionId: number, userId: string): Promise<Judgment | undefined>;

  // Comments
  createComment(comment: InsertComment & { userId: string }): Promise<Comment>;
  getComments(decisionId: number): Promise<Comment[]>;

  // Attachments
  createAttachment(attachment: InsertAttachment & { userId: string; extractedText?: string | null }): Promise<Attachment>;
  getAttachments(decisionId: number): Promise<Attachment[]>;
  getAttachment(id: number): Promise<Attachment | undefined>;
  updateAttachmentText(id: number, extractedText: string): Promise<Attachment>;
  deleteAttachment(id: number): Promise<void>;

  // Audit Logs
  createAuditLog(log: any): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Decisions
  async getDecisions(): Promise<Decision[]> {
    return await db.select().from(decisions).orderBy(decisions.createdAt);
  }

  async getDecision(id: number): Promise<Decision | undefined> {
    const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
    return decision;
  }

  async createDecision(insertDecision: InsertDecision & { authorId?: string | null }): Promise<Decision> {
    const [decision] = await db.insert(decisions).values(insertDecision).returning();
    return decision;
  }

  async updateDecision(id: number, update: Partial<InsertDecision>): Promise<Decision> {
    const [decision] = await db
      .update(decisions)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(decisions.id, id))
      .returning();
    return decision;
  }

  async deleteDecision(id: number): Promise<void> {
    await db.delete(decisions).where(eq(decisions.id, id));
  }

  // Judgments
  async createJudgment(insertJudgment: InsertJudgment & { userId: string }): Promise<Judgment> {
    const [judgment] = await db.insert(judgments).values(insertJudgment).returning();
    return judgment;
  }

  async getJudgments(decisionId: number): Promise<Judgment[]> {
    return await db.select().from(judgments).where(eq(judgments.decisionId, decisionId));
  }

  async getUserJudgment(decisionId: number, userId: string): Promise<Judgment | undefined> {
    const [judgment] = await db
      .select()
      .from(judgments)
      .where(and(eq(judgments.decisionId, decisionId), eq(judgments.userId, userId)));
    return judgment;
  }

  // Comments
  async createComment(insertComment: InsertComment & { userId: string }): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async getComments(decisionId: number): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.decisionId, decisionId)).orderBy(comments.createdAt);
  }

  // Attachments
  async createAttachment(insertAttachment: InsertAttachment & { userId: string; extractedText?: string | null }): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(insertAttachment).returning();
    return attachment;
  }

  async getAttachments(decisionId: number): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.decisionId, decisionId)).orderBy(attachments.createdAt);
  }

  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }

  async updateAttachmentText(id: number, extractedText: string): Promise<Attachment> {
    const [attachment] = await db.update(attachments).set({ extractedText }).where(eq(attachments.id, id)).returning();
    return attachment;
  }

  async deleteAttachment(id: number): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Audit Logs
  async createAuditLog(log: any): Promise<AuditLog> {
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(auditLogs.createdAt);
  }
}

export const storage = new DatabaseStorage();
