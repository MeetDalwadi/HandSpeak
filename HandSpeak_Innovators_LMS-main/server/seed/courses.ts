import { db } from '../db';
import { courses, modules, lessons } from '@shared/schema';

async function seed() {
  // Create courses for all three languages (ASL, BSL, ISL)
  const [
    numbersASL, alphabetsASL, greetingsASL,
    numbersBSL, alphabetsBSL, greetingsBSL,
    numbersISL, alphabetsISL, greetingsISL
  ] = await Promise.all([
    // ASL Courses
    db.insert(courses).values({
      title: 'Numbers in ASL',
      description: 'Master counting and numbers in American Sign Language. Learn to sign numbers from 0-100, including cardinal and ordinal numbers.',
      language: 'ASL',
      imageUrl: '/courses/numbers-asl.jpg',
      lessons: 10,
      durationHours: 5,
      level: 'beginner',
      category: 'numbers',
    }).returning(),
    db.insert(courses).values({
      title: 'ASL Alphabet',
      description: 'Learn the American Sign Language alphabet. Master fingerspelling and improve your communication skills.',
      language: 'ASL',
      imageUrl: '/courses/alphabet-asl.jpg',
      lessons: 8,
      durationHours: 4,
      level: 'beginner',
      category: 'alphabets',
    }).returning(),
    db.insert(courses).values({
      title: 'Essential Greetings in ASL',
      description: 'Learn common greetings and introductions in American Sign Language. Perfect for beginners starting their sign language journey.',
      language: 'ASL',
      imageUrl: '/courses/greetings-asl.jpg',
      lessons: 6,
      durationHours: 3,
      level: 'beginner',
      category: 'greetings',
    }).returning(),

    // BSL Courses
    db.insert(courses).values({
      title: 'British Sign Language Basics',
      description: 'Learn the fundamentals of British Sign Language (BSL)',
      language: 'BSL',
      imageUrl: '/thumbnails/bsl-course.jpg',
      lessons: 5,
      durationHours: 3,
      level: 'beginner',
      category: 'basics',
    }).returning(),
    db.insert(courses).values({
      title: 'Numbers in BSL',
      description: 'Learn to count and express numbers in British Sign Language',
      language: 'BSL',
      imageUrl: '/courses/numbers-bsl.jpg',
      lessons: 10,
      durationHours: 5,
      level: 'beginner',
      category: 'numbers',
    }).returning(),
    db.insert(courses).values({
      title: 'BSL Alphabet',
      description: 'Master the BSL alphabet and fingerspelling',
      language: 'BSL',
      imageUrl: '/courses/alphabet-bsl.jpg',
      lessons: 8,
      durationHours: 4,
      level: 'beginner',
      category: 'alphabets',
    }).returning(),
    db.insert(courses).values({
      title: 'Essential Greetings in BSL',
      description: 'Learn common greetings and introductions in British Sign Language',
      language: 'BSL',
      imageUrl: '/courses/greetings-bsl.jpg',
      lessons: 6,
      durationHours: 3,
      level: 'beginner',
      category: 'greetings',
    }).returning(),

    // ISL Courses
    db.insert(courses).values({
      title: 'Indian Sign Language Basics',
      description: 'Learn the fundamentals of Indian Sign Language (ISL)',
      language: 'ISL',
      imageUrl: '/thumbnails/isl-course.jpg',
      lessons: 5,
      durationHours: 3,
      level: 'beginner',
      category: 'basics',
    }).returning(),
    db.insert(courses).values({
      title: 'Numbers in ISL',
      description: 'Learn to count and express numbers in Indian Sign Language',
      language: 'ISL',
      imageUrl: '/courses/numbers-isl.jpg',
      lessons: 10,
      durationHours: 5,
      level: 'beginner',
      category: 'numbers',
    }).returning(),
    db.insert(courses).values({
      title: 'ISL Alphabet',
      description: 'Master the ISL alphabet and fingerspelling',
      language: 'ISL',
      imageUrl: '/courses/alphabet-isl.jpg',
      lessons: 8,
      durationHours: 4,
      level: 'beginner',
      category: 'alphabets',
    }).returning(),
    db.insert(courses).values({
      title: 'Essential Greetings in ISL',
      description: 'Learn common greetings and introductions in Indian Sign Language',
      language: 'ISL',
      imageUrl: '/courses/greetings-isl.jpg',
      lessons: 6,
      durationHours: 3,
      level: 'beginner',
      category: 'greetings',
    }).returning(),
  ]);

  // Create modules for each course
  const moduleData: {
    courseId: number;
    title: string;
    description: string;
    type: string;
    order: number;
    lessons: number;
  }[] = [];

  // Helper function to create module data
  const createModuleData = (course: typeof courses.$inferSelect[], language: string) => {
    if (course[0].category === 'numbers') {
      moduleData.push(
        {
          courseId: course[0].id,
          title: `Basic Numbers (0-20) in ${language}`,
          description: `Learn to sign numbers from 0 to 20 in ${language}.`,
          type: 'numbers',
          order: 1,
          lessons: 5,
        },
        {
          courseId: course[0].id,
          title: `Intermediate Numbers (21-100) in ${language}`,
          description: `Master larger numbers and counting patterns in ${language}.`,
          type: 'numbers',
          order: 2,
          lessons: 5,
        }
      );
    } else if (course[0].category === 'alphabets') {
      moduleData.push(
        {
          courseId: course[0].id,
          title: `${language} Letters A-Z`,
          description: `Learn all letters of the ${language} alphabet through clear demonstrations.`,
          type: 'alphabets',
          order: 1,
          lessons: 4,
        },
        {
          courseId: course[0].id,
          title: `${language} Fingerspelling Practice`,
          description: `Practice fingerspelling with common words and names in ${language}.`,
          type: 'alphabets',
          order: 2,
          lessons: 4,
        }
      );
    } else if (course[0].category === 'greetings') {
      moduleData.push(
        {
          courseId: course[0].id,
          title: `Basic Greetings in ${language}`,
          description: `Learn everyday greetings and basic introductions in ${language}.`,
          type: 'greetings',
          order: 1,
          lessons: 3,
        },
        {
          courseId: course[0].id,
          title: `Formal Introductions in ${language}`,
          description: `Master formal greetings and professional introductions in ${language}.`,
          type: 'greetings',
          order: 2,
          lessons: 3,
        }
      );
    } else if (course[0].category === 'basics') {
      moduleData.push(
        {
          courseId: course[0].id,
          title: `Introduction to ${language}`,
          description: `Learn the fundamentals of ${language}.`,
          type: 'basics',
          order: 1,
          lessons: 5,
        }
      );
    }
  };

  // Create modules for all courses
  createModuleData(numbersASL, 'ASL');
  createModuleData(alphabetsASL, 'ASL');
  createModuleData(greetingsASL, 'ASL');
  createModuleData(numbersBSL, 'BSL');
  createModuleData(alphabetsBSL, 'BSL');
  createModuleData(greetingsBSL, 'BSL');
  createModuleData(numbersISL, 'ISL');
  createModuleData(alphabetsISL, 'ISL');
  createModuleData(greetingsISL, 'ISL');
  createModuleData([numbersBSL[0]], 'BSL');
  createModuleData([numbersISL[0]], 'ISL');

  const allModules = await db.insert(modules).values(moduleData).returning();

  // Create lessons for each module
  for (const module of allModules) {
    const lessonData = [];
    const language = module.title.includes('ASL') ? 'ASL' : module.title.includes('BSL') ? 'BSL' : 'ISL';

    if (module.type === 'numbers') {
      for (let i = 0; i < 10; i++) {
        lessonData.push({
          moduleId: module.id,
          title: `Numbers ${i * 10 + 1}-${(i + 1) * 10}`,
          description: `Learn to sign numbers ${i * 10 + 1} through ${(i + 1) * 10} in ${language}`,
          content: `Learn the basic number signs in ${language}. Practice counting from ${i * 10 + 1} to ${(i + 1) * 10}. Learn variations and shortcuts.`,
          videoUrl: `https://example.com/videos/${language.toLowerCase()}/numbers/${i + 1}`,
          thumbnailUrl: `https://example.com/thumbnails/${language.toLowerCase()}/numbers/${i + 1}`,
          order: i + 1,
          duration: 300,
          keyPoints: [
            `Number signs ${i * 10 + 1}-${(i + 1) * 10}`,
            "Counting techniques",
            "Common number combinations",
            "Practice exercises"
          ],
          practiceExercises: [
            {
              type: "record",
              title: "Practice Numbers",
              description: `Record yourself signing numbers ${i * 10 + 1}-${(i + 1) * 10}`,
              content: {
                prompt: `Sign numbers ${i * 10 + 1}-${(i + 1) * 10}`
              }
            }
          ],
          resources: [
            {
              type: "pdf",
              title: "Number Guide",
              description: `Guide for numbers ${i * 10 + 1}-${(i + 1) * 10}`,
              url: `/resources/${language.toLowerCase()}/numbers/guide-${i + 1}.pdf`
            }
          ]
        });
      }
    } else if (module.type === 'alphabets') {
      const alphabetGroups = ["A-E", "F-J", "K-O", "P-T", "U-Z"];
      alphabetGroups.forEach((group, i) => {
        lessonData.push({
          moduleId: module.id,
          title: `${language} Alphabet: ${group}`,
          description: `Learn to fingerspell letters ${group} in ${language}`,
          content: `Learn the correct hand positions for letters ${group}. Practice transitioning between letters. Common words using these letters.`,
          videoUrl: `https://example.com/videos/${language.toLowerCase()}/alphabet/${i + 1}`,
          thumbnailUrl: `https://example.com/thumbnails/${language.toLowerCase()}/alphabet/${i + 1}`,
          order: i + 1,
          duration: 300,
          keyPoints: [
            `Letter signs ${group}`,
            "Hand positioning",
            "Fingerspelling practice",
            "Common words"
          ],
          practiceExercises: [
            {
              type: "record",
              title: "Practice Letters",
              description: `Record yourself signing letters ${group}`,
              content: {
                prompt: `Sign letters ${group}`
              }
            }
          ],
          resources: [
            {
              type: "pdf",
              title: "Alphabet Guide",
              description: `Guide for letters ${group}`,
              url: `/resources/${language.toLowerCase()}/alphabet/guide-${i + 1}.pdf`
            }
          ]
        });
      });
    } else if (module.type === 'greetings') {
      const greetingsLessons = [
        {
          title: "Hello and Goodbye",
          description: "Learn basic greetings",
          content: `Learn how to say hello, hi, and goodbye in ${language}.`,
          videoUrl: `/videos/${language.toLowerCase()}/greetings/hello-goodbye.mp4`,
          order: 1,
          keyPoints: [
            `Basic ${language} greetings`,
            "Different ways to say hello",
            "How to say goodbye",
            "Common greeting etiquette"
          ]
        },
        {
          title: "How are you?",
          description: `Learn to ask and respond to 'How are you?' in ${language}`,
          content: `Learn common phrases for asking and responding to 'How are you?' in ${language}.`,
          videoUrl: `/videos/${language.toLowerCase()}/greetings/how-are-you.mp4`,
          order: 2,
          keyPoints: [
            "Asking 'How are you?'",
            "Common responses",
            "Facial expressions",
            "Conversation flow"
          ]
        },
        {
          title: "Nice to meet you",
          description: `Learn to say 'Nice to meet you' in ${language}`,
          content: `Learn how to introduce yourself and say 'Nice to meet you' in ${language}.`,
          videoUrl: `/videos/${language.toLowerCase()}/greetings/nice-to-meet-you.mp4`,
          order: 3,
          keyPoints: [
            "Introducing yourself",
            "Saying 'Nice to meet you'",
            "Proper handshake etiquette",
            "Follow-up phrases"
          ]
        }
      ];

      greetingsLessons.forEach(lesson => {
        lessonData.push({
          moduleId: module.id,
          ...lesson,
          duration: 180,
          thumbnailUrl: null,
          practiceExercises: [
            {
              type: "record",
              title: `Practice ${lesson.title}`,
              description: `Record yourself practicing ${lesson.title.toLowerCase()}`,
              content: {
                prompt: `Practice signing ${lesson.title.toLowerCase()}`
              }
            }
          ],
          resources: [
            {
              type: "pdf",
              title: `${language} ${lesson.title} Guide`,
              description: `Detailed guide for ${lesson.title.toLowerCase()}`,
              url: `/resources/${language.toLowerCase()}/greetings/${lesson.title.toLowerCase().replace(/ /g, '-')}.pdf`
            }
          ]
        });
      });
    } else if (module.type === 'basics') {
      lessonData.push(
        {
          moduleId: module.id,
          title: `Introduction to ${language}`,
          description: `Learn the fundamentals of ${language}.`,
          content: `Learn the basic handshapes and finger positions in ${language}. Understand the importance of non-manual markers. Tips for clear communication.`,
          videoUrl: `/videos/${language.toLowerCase()}/basics/introduction.mp4`,
          thumbnailUrl: `/thumbnails/${language.toLowerCase()}/basics/introduction.jpg`,
          order: 1,
          duration: 600,
          keyPoints: [
            `Basic handshapes and finger positions in ${language}`,
            'Understanding the importance of non-manual markers',
            'Tips for clear communication',
          ],
          practiceExercises: [
            {
              type: 'record',
              title: 'Record Basic Signs',
              description: 'Record yourself signing basic signs.',
              content: {
                prompt: 'Sign basic signs'
              }
            },
            {
              type: 'quiz',
              title: 'Basic Sign Recognition',
              description: 'Identify the correct sign for each word.',
              content: {
                questions: [
                  {
                    type: 'matching',
                    prompt: 'Match the sign to the word',
                    options: ['Hello', 'Thank you', 'Yes', 'No'],
                  },
                ],
              },
            },
          ],
          resources: [
            {
              type: 'pdf',
              title: `${language} Basics Practice Sheet`,
              description: `Printable guide for practicing basic signs in ${language}`,
              url: `/resources/${language.toLowerCase()}/basics/practice.pdf`,
            },
          ],
        }
      );
    }

    if (lessonData.length > 0) {
      await db.insert(lessons).values(lessonData);
    }
  }

  console.log('Seed data inserted successfully!');
}

seed().catch(console.error);
