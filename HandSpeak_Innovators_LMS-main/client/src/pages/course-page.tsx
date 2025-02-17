import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Course, Module, UserProgress, Lesson } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Play, CheckCircle2, Clock, BookOpen, Award, Star, Users } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/navbar";

export default function CoursePage() {
  const [, params] = useRoute("/course/:id");
  const courseId = parseInt(params?.id || "0");

  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });

  const { data: modules, isLoading: isLoadingModules } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

  const { data: allLessons } = useQuery<Lesson[]>({
    queryKey: [`/api/courses/${courseId}/lessons`],
    enabled: !!modules, // Only fetch when modules are loaded
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  const isLoading = isLoadingCourse || isLoadingModules;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course || !modules) {
    return <div>Course not found</div>;
  }

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons, 0);
  const totalCompletedLessons = progress?.filter(p => 
    allLessons?.some(l => l.id === p.lessonId && p.progress === 100)
  ).length || 0;
  const totalProgress = allLessons ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Course Header */}
      <header className="pt-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-8">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-xl text-muted-foreground mb-6">{course.description}</p>
                
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">4.8</span>
                    <span className="text-muted-foreground">(2.1k reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>12.5k students enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{course.durationHours} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>{totalLessons} lessons</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {progress && (
                  <div className="flex items-center gap-4">
                    <Progress value={totalProgress} className="w-48" />
                    <span className="text-sm text-muted-foreground">
                    {totalProgress}% Complete
                    </span>
                  </div>
                  )}
                </div>

              </div>

                {/* Course Preview */}
                <div className="relative">
                  <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
                    <img
                    src={course.language === 'ASL' 
                    ? "https://www.cheggindia.com/wp-content/uploads/2023/10/asl-full-form.png"
                    : course.language === 'BSL'
                    ? "https://static.wixstatic.com/media/01bfb7_8aa34c78d4264726bef697101c7af839~mv2.jpg"
                    : course.language === 'ISL'
                    ? "https://www.indiancentury.in/wp-content/uploads/2022/09/Indian-Sign-language.jpeg"
                    : course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    />
                  </div>
                </div>

            </div>
          </div>
        </div>
      </header>

      {/* Course Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Module List */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Course Content</h2>
              <div className="space-y-4">
                {modules.map((module, index) => {
                    // Calculate module progress by averaging the progress of its lessons
                    const moduleLessons = allLessons?.filter(l => l.moduleId === module.id) || [];
                    const completedModuleLessons = progress?.filter(p => 
                      moduleLessons.some(l => l.id === p.lessonId && p.progress === 100)
                    ).length || 0;
                    const moduleProgress = Math.round((completedModuleLessons / module.lessons) * 100);


                  return (
                    <Card key={module.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-grow">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-medium text-muted-foreground">
                                  Module {index + 1}
                                </span>
                                {moduleProgress === 100 && (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                              <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                              <p className="text-muted-foreground mb-4">{module.description}</p>
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{module.lessons} lessons</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Progress value={moduleProgress} className="w-32" />
                                  <span className="text-sm text-muted-foreground">
                                    {moduleProgress}% Complete
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Link href={`/module/${module.id}`}>
                              <Button variant="secondary" className="shrink-0">
                                {moduleProgress === 100 ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Review
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    {moduleProgress > 0 ? 'Continue' : 'Start'}
                                  </>
                                )}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Course Info Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">What you'll learn</h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Master essential sign language vocabulary and phrases</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Understand grammar and sentence structure in sign language</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Practice real-world conversations and scenarios</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Build confidence in sign language communication</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Course Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm">
                      <Award className="h-5 w-5 text-primary" />
                      <span>Certificate of completion</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Clock className="h-5 w-5 text-primary" />
                      <span>Self-paced learning</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Users className="h-5 w-5 text-primary" />
                      <span>Community support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}