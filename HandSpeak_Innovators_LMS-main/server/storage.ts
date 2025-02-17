import { users, courses, modules, lessons, userProgress } from "@shared/schema";
import type { User, InsertUser, Course, Module, Lesson, UserProgress } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const alphabetTimestamps: Record<string, { start: number; end: number }> = {
  A: { start: 30, end: 38 },  // 0:30 to 0:38
  B: { start: 38, end: 46 },  // 0:38 to 0:46
  C: { start: 46, end: 52 },  // 0:46 to 0:52
  D: { start: 52, end: 62 },  // 0:52 to 1:02
  E: { start: 62, end: 69 },  // 1:02 to 1:09
  F: { start: 69, end: 78 },  // 1:09 to 1:18
  G: { start: 78, end: 86 },  // 1:18 to 1:26
  H: { start: 86, end: 94 },  // 1:26 to 1:34
  I: { start: 94, end: 102 }, // 1:34 to 1:42
  J: { start: 102, end: 110 }, // 1:42 to 1:50
  K: { start: 110, end: 121 }, // 1:50 to 2:01
  L: { start: 121, end: 127 }, // 2:01 to 2:07
  M: { start: 127, end: 136 }, // 2:07 to 2:16
  N: { start: 136, end: 146 }, // 2:16 to 2:26
  O: { start: 146, end: 153 }, // 2:26 to 2:33
  P: { start: 153, end: 161 }, // 2:33 to 2:41
  Q: { start: 161, end: 168 }, // 2:41 to 2:48
  R: { start: 168, end: 175 }, // 2:48 to 2:55
  S: { start: 175, end: 183 }, // 2:55 to 3:03
  T: { start: 183, end: 193 }, // 3:03 to 3:13
  U: { start: 193, end: 200 }, // 3:13 to 3:20
  V: { start: 200, end: 207 }, // 3:20 to 3:27
  W: { start: 207, end: 214 }, // 3:27 to 3:34
  X: { start: 214, end: 222 }, // 3:34 to 3:42
  Y: { start: 222, end: 232 }, // 3:42 to 3:52
  Z: { start: 232, end: 240 }  // 3:52 to 4:00
};

const numberTimestamps: Record<number, { start: number; end: number }> = {
  0: { start: 84, end: 90 },   // 1:24 - 1:30
  1: { start: 90, end: 96 },   // 1:30 - 1:36
  2: { start: 96, end: 103 },  // 1:36 - 1:43
  3: { start: 103, end: 114 }, // 1:43 - 1:54
  4: { start: 114, end: 123 }, // 1:54 - 2:03
  5: { start: 123, end: 132 }, // 2:03 - 2:12
  6: { start: 132, end: 145 }, // 2:12 - 2:25
  7: { start: 145, end: 153 }, // 2:25 - 2:33
  8: { start: 153, end: 160 }, // 2:33 - 2:40
  9: { start: 160, end: 169 }, // 2:40 - 2:49
  10: { start: 169, end: 176 } // 2:49 - end
};

const greetingsTimestamps: Record<string, { start: number; end: number }> = {
  "Bored": { start: 77, end: 85 },      // 1:17 - 1:25
  "Busy": { start: 85, end: 98 },       // 1:25 - 1:38
  "Sleepy": { start: 98, end: 106 },    // 1:38 - 1:46
  "Tired": { start: 106, end: 116 },    // 1:46 - 1:56
  "Sick": { start: 116, end: 125 },     // 1:56 - 2:05
  "Sad": { start: 125, end: 135 },      // 2:05 - 2:15
  "Scared": { start: 135, end: 144 },   // 2:15 - 2:24
  "Mad": { start: 144, end: 155 },      // 2:24 - 2:35
  "Confused": { start: 155, end: 166 }, // 2:35 - 2:46
  "Nothing": { start: 166, end: 175 },  // 2:46 - 2:55
  "Same": { start: 175, end: 186 },     // 2:55 - 3:06
  "Bad": { start: 186, end: 195 },      // 3:06 - 3:15
  "SoSo": { start: 195, end: 203 },     // 3:15 - 3:23
  "Fine": { start: 203, end: 210 },     // 3:23 - 3:30
  "Good": { start: 210, end: 220 },     // 3:30 - 3:40
  "Excited": { start: 220, end: 229 },  // 3:40 - 3:49
  "Happy": { start: 229, end: 238 }     // 3:49 - end
};

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getModules(courseId: number): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  getLessons(moduleId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getUserProgress(userId: number): Promise<UserProgress[]>;
  updateProgress(userId: number, lessonId: number, progress: number): Promise<void>;
  getCourseLessons(courseId: number): Promise<Lesson[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private modules: Map<number, Module>;
  private lessons: Map<number, Lesson>;
  private progress: Map<string, UserProgress>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.modules = new Map();
    this.lessons = new Map();
    this.progress = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Seed courses, modules and lessons
    this.seedCoursesAndModules();
  }

  private generateNumberLessons(startId: number, moduleId: number, language: string): Lesson[] {
    const lessons: Lesson[] = [];
    for (let i = 0; i <= 10; i++) {
      lessons.push({
        id: startId + i,
        moduleId,
        title: `Number ${i}`,
        description: `Learn to sign number ${i} in ${language}`,
        content: `Learn how to sign the number ${i} in ${language}`,
        videoUrl: `https://www.youtube.com/embed/Y4stD_ypaAI?start=${numberTimestamps[i]?.start || 0}&end=${numberTimestamps[i]?.end || 15}&autoplay=1&rel=0&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=0&widget_referrer=0&cc_load_policy=0&cc_lang_pref=0&playsinline=1`,
        thumbnailUrl: `https://img.youtube.com/vi/Y4stD_ypaAI/maxresdefault.jpg`,
        order: i + 1,
        duration: (numberTimestamps[i]?.end || 15) - (numberTimestamps[i]?.start || 0),
        keyPoints: [
          `Hand position for number ${i}`,
          "Common mistakes to avoid",
          "Practice exercises"
        ],
        practiceExercises: [
          {
            type: "record",
            title: `Practice Number ${i}`,
            description: `Record yourself signing number ${i}`,
            content: {
              prompt: `Sign number ${i}`
            }
          }
        ],
        resources: [
          {
            type: "pdf",
            title: `${language} Number ${i} Guide`,
            description: `Guide for signing number ${i}`,
            url: `/resources/${language.toLowerCase()}/numbers/number-${i}.pdf`
          }
        ]
      });
    }
    return lessons;
  }

  private generateAlphabetLessons(startId: number, moduleId: number, language: string): Lesson[] {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.map((letter, index) => ({
      id: startId + index,
      moduleId,
      title: `Letter ${letter}`,
      description: `Learn to sign letter ${letter} in ${language}`,
      content: `Learn how to sign the letter ${letter} in ${language}`,
        videoUrl: `https://www.youtube.com/embed/sHyG7iz3ork?start=${alphabetTimestamps[letter]?.start || 0}&end=${alphabetTimestamps[letter]?.end || 15}&autoplay=1&rel=0&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=0&widget_referrer=0&cc_load_policy=0&cc_lang_pref=0&playsinline=1`,
        thumbnailUrl: `https://img.youtube.com/vi/sHyG7iz3ork/maxresdefault.jpg`,
      order: index + 1,
      duration: (alphabetTimestamps[letter]?.end || 15) - (alphabetTimestamps[letter]?.start || 0),
        keyPoints: [
        `Hand position for letter ${letter}`,
        "Common mistakes to avoid",
        "Practice exercises"
      ],
      practiceExercises: [
        {
          type: "record",
          title: `Practice Letter ${letter}`,
          description: `Record yourself signing letter ${letter}`,
          content: {
            prompt: `Sign letter ${letter}`
          }
        }
      ],
      resources: [
        {
          type: "pdf",
          title: `${language} Letter ${letter} Guide`,
          description: `Guide for signing letter ${letter}`,
          url: `/resources/${language.toLowerCase()}/alphabet/letter-${letter.toLowerCase()}.pdf`
        }
      ]
    }));
  }

  private seedCoursesAndModules() {
    // Create the three main courses
    const sampleCourses: Course[] = [
      {
        id: 1,
        title: "American Sign Language (ASL)",
        description: "Learn American Sign Language (ASL) - Alphabet, Numbers, and Basic Greetings",
        language: "ASL",
        imageUrl: "/courses/asl-course.jpg",
        lessons: 39, // 26 alphabet + 10 numbers + 3 greetings
        durationHours: 10,
        level: "beginner",
        category: "comprehensive"
      },
      {
        id: 2,
        title: "British Sign Language (BSL)",
        description: "Learn British Sign Language (BSL) - Alphabet, Numbers, and Basic Greetings",
        language: "BSL",
        imageUrl: "/courses/bsl-course.jpg",
        lessons: 39,
        durationHours: 10,
        level: "beginner",
        category: "comprehensive"
      },
      {
        id: 3,
        title: "Indian Sign Language (ISL)",
        description: "Learn Indian Sign Language (ISL) - Alphabet, Numbers, and Basic Greetings",
        language: "ISL",
        imageUrl: "/courses/isl-course.jpg",
        lessons: 39,
        durationHours: 10,
        level: "beginner",
        category: "comprehensive"
      }
    ];

    // Add courses to storage
    sampleCourses.forEach(course => this.courses.set(course.id, course));

    // Create modules for each course (3 modules per course)
    const sampleModules: Module[] = [
      // ASL Modules
      {
        id: 1,
        courseId: 1,
        title: "ASL Alphabet",
        description: "Learn the ASL alphabet - 26 letters",
        type: "alphabets",
        order: 1,
        lessons: 26
      },
      {
        id: 2,
        courseId: 1,
        title: "ASL Numbers",
        description: "Learn numbers 1-10 in ASL",
        type: "numbers",
        order: 2,
        lessons: 10
      },
      {
        id: 3,
        courseId: 1,
        title: "ASL Basic Words & Greetings",
        description: "Learn essential greetings and phrases in ASL",
        type: "greetings",
        order: 3,
        lessons: 17
      },

      // BSL Modules
      {
        id: 4,
        courseId: 2,
        title: "BSL Alphabet",
        description: "Learn the BSL alphabet - 26 letters",
        type: "alphabets",
        order: 1,
        lessons: 26
      },
      {
        id: 5,
        courseId: 2,
        title: "BSL Numbers",
        description: "Learn numbers 1-10 in BSL",
        type: "numbers",
        order: 2,
        lessons: 10
      },
      {
        id: 6,
        courseId: 2,
        title: "BSL Basic Words & Greetings",
        description: "Learn essential greetings and phrases in BSL",
        type: "greetings",
        order: 3,
        lessons: 17
      },

      // ISL Modules
      {
        id: 7,
        courseId: 3,
        title: "ISL Alphabet",
        description: "Learn the ISL alphabet - 26 letters",
        type: "alphabets",
        order: 1,
        lessons: 26
      },
      {
        id: 8,
        courseId: 3,
        title: "ISL Numbers",
        description: "Learn numbers 1-10 in ISL",
        type: "numbers",
        order: 2,
        lessons: 10
      },
      {
        id: 9,
        courseId: 3,
        title: "ISL Basic Words & Greetings",
        description: "Learn essential greetings and phrases in ISL",
        type: "greetings",
        order: 3,
        lessons: 17
      }
    ];

    // Add modules to storage
    sampleModules.forEach(module => this.modules.set(module.id, module));

    // Generate lessons for each module
    let currentLessonId = 1;

    sampleModules.forEach(module => {
      let moduleLessons: Lesson[] = [];
      const language = module.title.split(" ")[0];

      if (module.type === "alphabets") {
        moduleLessons = this.generateAlphabetLessons(currentLessonId, module.id, language);
      } else if (module.type === "numbers") {
        moduleLessons = this.generateNumberLessons(currentLessonId, module.id, language);
      } else if (module.type === "greetings") {
        const greetingsLessons = Object.entries(greetingsTimestamps).map(([emotion, timestamps], index) => ({
          id: currentLessonId + index,
          moduleId: module.id,
          title: emotion,
          description: `Learn to sign "${emotion}" in ${language}`,
          content: `Learn how to express "${emotion}" in ${language} sign language`,
            videoUrl: `https://www.youtube.com/embed/RZQTVnzMx4U?start=${timestamps.start}&end=${timestamps.end}&autoplay=1&rel=0&controls=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=0&widget_referrer=0&cc_load_policy=0&cc_lang_pref=0&playsinline=1`,
            thumbnailUrl: `https://img.youtube.com/vi/RZQTVnzMx4U/maxresdefault.jpg`,
          order: index + 1,
          duration: timestamps.end - timestamps.start,
          keyPoints: [
          `Hand position for "${emotion}"`,
          "Facial expressions",
          "Common variations",
          "Practice tips"
          ],
          practiceExercises: [
          {
            type: "record",
            title: `Practice ${emotion}`,
            description: `Record yourself signing "${emotion}"`,
            content: {
            prompt: `Sign "${emotion}"`
            }
          }
          ],
          resources: [
          {
            type: "pdf",
            title: `${language} ${emotion} Guide`,
            description: `Guide for signing "${emotion}"`,
            url: `/resources/${language.toLowerCase()}/greetings/${emotion.toLowerCase()}.pdf`
          }
          ]
        }));

        moduleLessons = greetingsLessons;
      }

      // Add lessons to storage
      moduleLessons.forEach(lesson => this.lessons.set(lesson.id, lesson));
      currentLessonId += moduleLessons.length;
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getModules(courseId: number): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(m => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async getLessons(moduleId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(l => l.moduleId === moduleId)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    return Array.from(this.progress.values()).filter(p => p.userId === userId);
  }

  async updateProgress(userId: number, lessonId: number, progress: number): Promise<void> {
    const key = `${userId}-${lessonId}`;
    const existing = this.progress.get(key);

    if (existing) {
      this.progress.set(key, {
        ...existing,
        progress,
        completed: progress === 100
      });
    } else {
      this.progress.set(key, {
        id: this.currentId++,
        userId,
        lessonId,
        progress,
        completed: progress === 100,
        practiceResults: null
      });
    }
  }

  async getCourseLessons(courseId: number): Promise<Lesson[]> {
    const modules = await this.getModules(courseId);
    const moduleIds = modules.map(m => m.id);
    return Array.from(this.lessons.values())
      .filter(l => moduleIds.includes(l.moduleId))
      .sort((a, b) => a.moduleId - b.moduleId || a.order - b.order);
  }
}

export const storage = new MemStorage();