import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@shared/schema";
import { Clock, BookOpen, Star, Users } from "lucide-react";
import { Link } from "wouter";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={course.language === 'ASL' 
          ? "https://www.cheggindia.com/wp-content/uploads/2023/10/asl-full-form.png"
          : course.language === 'BSL'
          ? "https://static.wixstatic.com/media/01bfb7_8aa34c78d4264726bef697101c7af839~mv2.jpg"
          : course.language === 'ISL'
          ? "https://www.indiancentury.in/wp-content/uploads/2022/09/Indian-Sign-language.jpeg"
          : course.imageUrl}
          alt={course.title}
          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/90 text-primary text-sm rounded-full font-medium shadow-sm">
            {course.language}
          </span>
        </div>
      </div>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            4.8
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            1.2k students
          </span>
        </div>
        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{course.durationHours} hours to complete</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{course.lessons} lessons</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Link href={`/course/${course.id}`} className="w-full">
          <Button className="w-full" variant="secondary">Enroll Now</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}