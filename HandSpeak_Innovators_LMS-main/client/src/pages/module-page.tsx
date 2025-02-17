import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Module, Lesson, UserProgress } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Play, CheckCircle2, Clock } from "lucide-react";

function getYouTubeThumbnail(videoUrl: string): string {
  const match = videoUrl.match(/embed\/([^?]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : '';
}

export default function ModulePage() {
  const [, params] = useRoute("/module/:id");
  const moduleId = parseInt(params?.id || "0");

  const { data: module, isLoading: isLoadingModule } = useQuery<Module>({
    queryKey: [`/api/modules/${moduleId}`],
  });

  const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: [`/api/modules/${moduleId}/lessons`],
  });

  const { data: progress } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });

  const isLoading = isLoadingModule || isLoadingLessons;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!module || !lessons) {
    return <div>Module not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
        <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{module.title}</h1>
          <p className="text-muted-foreground mt-2">{module.description}</p>
            {progress && (
            <div className="mt-4 flex items-center gap-4">
            <Progress 
              value={Math.round((progress.filter(p => 
              lessons.some(l => l.id === p.lessonId && p.progress === 100)
              ).length / lessons.length) * 100)} 
              className="w-48" 
            />
            <span className="text-sm text-muted-foreground">
              {Math.round((progress.filter(p => 
              lessons.some(l => l.id === p.lessonId && p.progress === 100)
              ).length / lessons.length) * 100)}% Complete
            </span>
            </div>
            )}
        </div>
        </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lessons.map((lesson) => {
              const lessonProgress = progress?.find(p => p.lessonId === lesson.id)?.progress || 0;

              return (
                <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                    <div className="relative aspect-video">
                      <div className="absolute inset-0 bg-black">
                      <img 
                        src={getYouTubeThumbnail(lesson.videoUrl)}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                      />
                      </div>

                      {/* Progress Overlay */}
                      {lessonProgress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                        <Progress value={lessonProgress} className="h-1" />
                      </div>
                      )}

                      {/* Play/Complete Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      {lessonProgress === 100 ? (
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      ) : (
                        <Play className="h-12 w-12 text-white" />
                      )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2 line-clamp-1">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}</span>
                        {lessonProgress === 100 && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-muted" />
                            <span className="text-primary flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Completed
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}