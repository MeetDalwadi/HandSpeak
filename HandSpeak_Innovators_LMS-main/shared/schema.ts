import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  language: text("language").notNull(),
  imageUrl: text("image_url").notNull(),
  lessons: integer("lessons").notNull(),
  durationHours: integer("duration_hours").notNull(),
  level: text("level").notNull().default('beginner'), // beginner, intermediate, advanced
  category: text("category").notNull(), // numbers, alphabets, greetings
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'numbers', 'alphabets', 'greetings'
  order: integer("order").notNull(),
  lessons: integer("lessons").notNull(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  order: integer("order").notNull(),
  duration: integer("duration").notNull(), // in seconds
  keyPoints: jsonb("key_points").notNull().$type<string[]>(),
  practiceExercises: jsonb("practice_exercises").notNull().$type<{
    type: string; // 'record', 'quiz', 'matching'
    title: string;
    description: string;
    content: any;
  }[]>(),
  resources: jsonb("resources").notNull().$type<{
    type: string; // 'pdf', 'video', 'link'
    title: string;
    description: string;
    url: string;
  }[]>(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  practiceResults: jsonb("practice_results").$type<{
    exerciseId: number;
    score: number;
    completedAt: string;
  }[]>(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;