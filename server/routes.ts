import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema, generateFileId } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/files", async (req, res) => {
    try {
      const fileData = {
        ...req.body,
        fileId: generateFileId() // Use shorter IDs
      };
      const validatedData = insertFileSchema.parse(fileData);
      const file = await storage.createFile(validatedData);
      res.json(file);
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ message: "Invalid file data" });
        return;
      }
      throw err;
    }
  });

  app.get("/api/files/:fileId", async (req, res) => {
    const file = await storage.getFile(req.params.fileId);
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }
    res.json(file);
  });

  app.post("/api/files/:fileId/downloaded", async (req, res) => {
    await storage.markAsDownloaded(req.params.fileId);
    await storage.incrementDownloadCount(req.params.fileId);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}