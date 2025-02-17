import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/courses", async (_req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) {
      res.status(404).send("Course not found");
      return;
    }
    res.json(course);
  });

  app.get("/api/courses/:id/modules", async (req, res) => {
    const modules = await storage.getModules(parseInt(req.params.id));
    res.json(modules);
  });

  app.get("/api/courses/:id/lessons", async (req, res) => {
    const lessons = await storage.getCourseLessons(parseInt(req.params.id));
    res.json(lessons);
  });

  app.get("/api/modules/:id", async (req, res) => {
    const module = await storage.getModule(parseInt(req.params.id));
    if (!module) {
      res.status(404).send("Module not found");
      return;
    }
    res.json(module);
  });

  app.get("/api/modules/:id/lessons", async (req, res) => {
    const lessons = await storage.getLessons(parseInt(req.params.id));
    res.json(lessons);
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lesson = await storage.getLesson(parseInt(req.params.id));
    if (!lesson) {
      res.status(404).send("Lesson not found");
      return;
    }
    res.json(lesson);
  });

  app.get("/api/progress", async (req, res) => {
    if (!req.user) {
      res.status(401).send("Unauthorized");
      return;
    }
    const progress = await storage.getUserProgress(req.user.id);
    res.json(progress);
  });

  app.post("/api/progress/:lessonId", async (req, res) => {
    if (!req.user) {
      res.status(401).send("Unauthorized");
      return;
    }

    const lessonId = parseInt(req.params.lessonId);
    const progress = parseInt(req.body.progress);

    if (isNaN(progress) || progress < 0 || progress > 100) {
      res.status(400).send("Invalid progress value");
      return;
    }

    await storage.updateProgress(req.user.id, lessonId, progress);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}