import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { z } from "zod";
import { insertDecisionSchema, insertJudgmentSchema, insertCommentSchema } from "@shared/schema";
import { calculateVariance } from "./services/varianceEngine";
import { streamLLMResponse, PROVIDER_INFO, type LLMProvider } from "./services/llmService";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { extractTextFromBuffer, isParseableType } from "./services/documentParser";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Object Storage
  registerObjectStorageRoutes(app);

  // === Decisions ===
  app.get(api.decisions.list.path, async (req, res) => {
    const decisions = await storage.getDecisions();
    res.json(decisions);
  });

  app.get(api.decisions.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    const decision = await storage.getDecision(id);
    if (!decision) return res.status(404).json({ message: "Decision not found" });
    res.json(decision);
  });

  app.post(api.decisions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const data = insertDecisionSchema.parse(req.body);
      const decision = await storage.createDecision({
        ...data,
        authorId: (req.user as any).claims.sub
      });
      res.status(201).json(decision);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.put(api.decisions.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    
    try {
      const data = insertDecisionSchema.partial().parse(req.body);
      const decision = await storage.updateDecision(id, data);
      res.json(decision);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.decisions.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    await storage.deleteDecision(id);
    res.status(204).send();
  });

  // === Judgments ===
  app.post(api.judgments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });

    try {
      const data = insertJudgmentSchema.omit({ decisionId: true }).parse(req.body);
      // Check if user already submitted?
      const existing = await storage.getUserJudgment(decisionId, (req.user as any).claims.sub);
      if (existing) {
        return res.status(400).json({ message: "You have already submitted a judgment for this decision." });
      }

      const judgment = await storage.createJudgment({
        ...data,
        decisionId,
        userId: (req.user as any).claims.sub
      });
      res.status(201).json(judgment);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.get(api.judgments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });

    // Check if decision is closed or user has submitted?
    // For now, just return all judgments
    const judgments = await storage.getJudgments(decisionId);
    res.json(judgments);
  });

  // === Comments ===
  app.post(api.comments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });

    try {
      const data = insertCommentSchema.omit({ decisionId: true }).parse(req.body);
      const comment = await storage.createComment({
        ...data,
        decisionId,
        userId: (req.user as any).claims.sub
      });
      res.status(201).json(comment);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.get(api.comments.list.path, async (req, res) => {
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });
    const comments = await storage.getComments(decisionId);
    res.json(comments);
  });

  // === Variance / Noise Analysis ===
  app.get("/api/decisions/:decisionId/variance", async (req, res) => {
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });
    const judgments = await storage.getJudgments(decisionId);
    const scores = judgments.map(j => j.score);
    const result = calculateVariance(scores);
    res.json(result);
  });

  // === Available LLM Providers ===
  app.get("/api/coaching/providers", async (_req, res) => {
    const providers = Object.entries(PROVIDER_INFO).map(([id, info]) => ({
      id,
      name: info.name,
      model: info.model,
    }));
    res.json(providers);
  });

  // === AI Coaching Chat (SSE streaming) ===
  app.post("/api/coaching/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

    const { message, decisionId, provider = "openai" } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const validProviders: LLMProvider[] = ["openai", "claude", "gemini"];
    const selectedProvider: LLMProvider = validProviders.includes(provider) ? provider : "openai";

    let context = "";
    if (decisionId) {
      const decision = await storage.getDecision(decisionId);
      if (decision) {
        const judgments = await storage.getJudgments(decisionId);
        const scores = judgments.map(j => j.score);
        const variance = calculateVariance(scores);
        context = `Decision context: "${decision.title}" - ${decision.description}. Category: ${decision.category}. Status: ${decision.status}. ${judgments.length} judgments submitted. Mean score: ${variance.mean}, Std Dev: ${variance.stdDev}, High noise: ${variance.isHighNoise}.`;

        const atts = await storage.getAttachments(decisionId);
        const docsWithText = atts.filter(a => a.extractedText);
        if (docsWithText.length > 0) {
          const docSummaries = docsWithText.map(a => `[${a.fileName}]: ${a.extractedText!.substring(0, 3000)}`).join("\n\n");
          context += `\n\nAttached documents:\n${docSummaries}`;
        }
      }
    }

    const systemPrompt = `You are Clarvoy's AI Decision Coach. You help leaders make better decisions by identifying cognitive biases, reducing noise in group judgments, and applying structured decision-making frameworks. You reference concepts like pre-mortem analysis, reference class forecasting, base rates, and adversarial debate. Be concise, practical, and direct. ${context}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await streamLLMResponse({
      provider: selectedProvider,
      systemPrompt,
      userMessage: message,
      onChunk: (content) => {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      },
      onDone: () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      onError: (error) => {
        if (res.headersSent) {
          res.write(`data: ${JSON.stringify({ error })}\n\n`);
          res.end();
        } else {
          res.status(500).json({ message: error });
        }
      },
    });
  });

  // === Attachments ===
  const objectStorageService = new ObjectStorageService();

  const ALLOWED_MIME_TYPES = [
    "application/pdf", "text/plain",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg", "image/jpg", "image/png",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  app.post("/api/uploads/request-url", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { name, size, contentType } = req.body;
    if (!name) return res.status(400).json({ error: "Missing required field: name" });
    if (contentType && !ALLOWED_MIME_TYPES.includes(contentType)) {
      return res.status(400).json({ error: "Unsupported file type" });
    }
    if (size && size > MAX_FILE_SIZE) {
      return res.status(400).json({ error: "File too large. Maximum 10MB." });
    }
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/decisions/:decisionId/attachments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });

    const decision = await storage.getDecision(decisionId);
    if (!decision) return res.status(404).json({ message: "Decision not found" });

    try {
      const { fileName, fileType, fileSize, objectPath, context } = req.body;
      if (!fileName || !fileType || !fileSize || !objectPath) {
        return res.status(400).json({ message: "Missing required attachment fields" });
      }
      if (!ALLOWED_MIME_TYPES.includes(fileType)) {
        return res.status(400).json({ message: "Unsupported file type" });
      }
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({ message: "File too large. Maximum 10MB." });
      }

      let extractedText: string | null = null;
      if (isParseableType(fileType)) {
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
          const [buffer] = await objectFile.download();
          extractedText = await extractTextFromBuffer(buffer, fileType);
          if (extractedText && extractedText.length > 50000) {
            extractedText = extractedText.substring(0, 50000) + "\n[...truncated]";
          }
        } catch (e) {
          console.error("Text extraction failed:", e);
        }
      }

      const attachment = await storage.createAttachment({
        decisionId,
        userId: (req.user as any).claims.sub,
        fileName,
        fileType,
        fileSize,
        objectPath,
        extractedText,
        context: context || "decision",
      });

      res.status(201).json(attachment);
    } catch (e) {
      console.error("Attachment creation error:", e);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  app.get("/api/decisions/:decisionId/attachments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const decisionId = parseInt(req.params.decisionId);
    if (isNaN(decisionId)) return res.status(400).json({ message: "Invalid Decision ID" });
    const atts = await storage.getAttachments(decisionId);
    res.json(atts);
  });

  app.get("/api/attachments/:id/text", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const attachment = await storage.getAttachment(id);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });
    res.json({ extractedText: attachment.extractedText || "" });
  });

  app.delete("/api/attachments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteAttachment(id);
    res.status(204).send();
  });

  // === Audit Logs ===
  app.get("/api/admin/audit-logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  return httpServer;
}
