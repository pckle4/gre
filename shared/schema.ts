import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  fileId: text("file_id").notNull().unique(), // Will use shorter IDs
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  content: text("content").notNull(), // Base64 encoded content
  downloaded: boolean("downloaded").default(false).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  uploaderId: text("uploader_id").notNull(), // Add uploader ID
  uploadTime: text("upload_time").notNull() // Add upload timestamp
});

export const insertFileSchema = createInsertSchema(files).pick({
  fileId: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  content: true,
  uploaderId: true,
  uploadTime: true
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// Helper to generate short, readable IDs
export const generateFileId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

// Helper to generate uploader ID (session-based)
export const generateUploaderId = () => {
  return `up_${generateFileId()}`;
};