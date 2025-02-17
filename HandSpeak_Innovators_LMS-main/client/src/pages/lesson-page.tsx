import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Lesson, Module, UserProgress } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SignLanguageVideo from "@/components/sign-language-video";
import { Navbar } from "@/components/layout/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from 'react';
import HandSignDetector from '@/components/HandSignDetector.jsx';

export default function LessonPage() {

  const [isDetectorOpen, setIsDetectorOpen] = useState(false);
  const [, params] = useRoute("/lesson/:id");
  const [, setLocation] = useLocation();
  const lessonId = parseInt(params?.id || "0");

  const { data: lesson, isLoading: isLoadingLesson } = useQuery<Lesson>({
    queryKey: [`/api/lessons/${lessonId}`],
  });

  const { data: module, isLoading: isLoadingModule } = useQuery<Module>({
    queryKey: [`/api/modules/${lesson?.moduleId}`],
    enabled: !!lesson,
  });

  const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: [`/api/modules/${lesson?.moduleId}/lessons`],
    enabled: !!lesson,
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  const lessonProgress = progress?.find(p => p.lessonId === lessonId)?.progress || 0;

  const progressMutation = useMutation({
    mutationFn: async (progress: number) => {
      await apiRequest("POST", `/api/progress/${lessonId}`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      if (lessonProgress === 100 && nextLesson) {
        setTimeout(() => {
          setLocation(`/lesson/${nextLesson.id}`);
        }, 2000);
      }
    },
  });

  const isLoading = isLoadingLesson || isLoadingModule || isLoadingLessons;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!lesson || !module || !lessons) {
    return <div>Lesson not found</div>;
  }

  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  const previousLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Course Navigation */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Lesson {currentIndex + 1} of {lessons.length}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lessonProgress === 100 && (
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{lesson.title}</h1>
              <p className="text-muted-foreground">{lesson.description}</p>
            </div>

            <Card className="mb-8">
              <div className="relative">
                <SignLanguageVideo
                  src={lesson.videoUrl}
                  title={lesson.title}
                  thumbnailUrl={lesson.thumbnailUrl || undefined}
                  onProgress={(progress) => progressMutation.mutate(progress)}
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <Progress value={lessonProgress} className="h-2 bg-white/20" />
                </div>
              </div>
            </Card>

            <Tabs defaultValue="content" className="mb-8">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="content">Lesson Content</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="mt-6">
                <div className="prose prose-slate max-w-none">
                  <h2>Learning Objectives</h2>
                  <ul>
                    <li>Understand the correct hand positions and movements</li>
                    <li>Practice the signs with proper technique</li>
                    <li>Learn common variations and usage contexts</li>
                  </ul>

                  <h2>Key Points</h2>
                  <ul>
                    {lesson.keyPoints?.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>

                  <h2>Practice Tips</h2>
                  <ul>
                    <li>Practice in front of a mirror to check your form</li>
                    <li>Record yourself and compare with the video</li>
                    <li>Practice with a partner for better learning</li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="practice" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Practice Exercise</h3>
                      <p className="mb-4">Record yourself performing the sign and compare it with the instructor's demonstration.</p>
                        <div className="flex items-center gap-4">
                        <Button
                          onClick={() => setIsDetectorOpen(true)}
                          variant="default"
                        >
                          Practice Sign Language
                        </Button>
                        </div>

                        <HandSignDetector
                        isOpen={isDetectorOpen}
                        onClose={() => setIsDetectorOpen(false)}
                        />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="resources" className="mt-6">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Download className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-medium">Practice Sheet</h3>
                          <p className="text-sm text-muted-foreground">PDF worksheet for offline practice</p>
                        </div>
                      </div>
                      <Button variant="outline">Download</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              {previousLesson ? (
                <Link href={`/lesson/${previousLesson.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Previous Lesson
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextLesson && (
                <Link href={`/lesson/${nextLesson.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    Next Lesson
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Module Progress</h3>
                <div className="space-y-4">
                  {lessons.map((l, index) => {
                    const lessonProgress = progress?.find(p => p.lessonId === l.id)?.progress || 0;
                    return (
                      <Link key={l.id} href={`/lesson/${l.id}`}>
                        <div className={`p-3 rounded-lg flex items-center gap-3 hover:bg-muted transition-colors ${l.id === lessonId ? 'bg-muted' : ''}`}>
                          <div className="flex-1">
                            <div className="font-medium">{l.title}</div>
                            <div className="text-sm text-muted-foreground">Lesson {index + 1}</div>
                          </div>
                          {lessonProgress === 100 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="text-sm text-muted-foreground">{lessonProgress}%</div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}