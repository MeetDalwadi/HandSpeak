import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, Search, GraduationCap, Award, Users } from "lucide-react";
import CourseCard from "@/components/course-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/navbar";

export default function HomePage() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  if (!courses) {
    return <div>No courses found</div>;
  }

  const aslCourses = courses.filter(course => course.language === 'ASL');
  const bslCourses = courses.filter(course => course.language === 'BSL');
  const islCourses = courses.filter(course => course.language === 'ISL');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
          {/* Hero Section */}
          <section className="pt-24 pb-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
            <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text leading-tight">
              Break Barriers Through Sign Language
            </h1>
            <p className="text-2xl text-muted-foreground leading-relaxed">
              Embark on a transformative journey with HandSpeak Innovators. 
              Master the art of sign language and open doors to meaningful connections 
              in a world where every gesture speaks volumes.
            </p>
            </div>
          </div>
          </section>


      {/* Course Catalog */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Explore Our Courses</h2>
            <p className="text-muted-foreground">Find the perfect course to achieve your learning goals</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search courses..."
              className="h-10 w-[250px] rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-4 w-[500px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="asl">ASL</TabsTrigger>
                <TabsTrigger value="bsl">BSL</TabsTrigger>
                <TabsTrigger value="isl">ISL</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all">
              <div>
                <h3 className="text-2xl font-bold text-center mb-8">All Sign Language Courses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="asl">
              <div>
              <div className="relative rounded-lg overflow-hidden mb-12">
                <img 
                src="https://www.cheggindia.com/wp-content/uploads/2023/10/asl-full-form.png"
                alt="ASL Banner"
                className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h3 className="text-3xl font-bold text-white text-center">American Sign Language Courses</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {aslCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
                ))}
              </div>
              </div>
            </TabsContent>

            <TabsContent value="bsl">
              <div>
              <div className="relative rounded-lg overflow-hidden mb-12">
              <img 
              src="https://static.wixstatic.com/media/01bfb7_8aa34c78d4264726bef697101c7af839~mv2.jpg"
              alt="BSL Banner"
              className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h3 className="text-3xl font-bold text-white text-center">British Sign Language Courses</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bslCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
                ))}
              </div>
              </div>
            </TabsContent>

            <TabsContent value="isl">
              <div>
              <div className="relative rounded-lg overflow-hidden mb-12">
                <img 
                src="https://www.indiancentury.in/wp-content/uploads/2022/09/Indian-Sign-language.jpeg"
                alt="ISL Banner"
                className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <h3 className="text-3xl font-bold text-white text-center">Indian Sign Language Courses</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {islCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
                ))}
              </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-90">Join thousands of students who are already mastering sign language with us.</p>
          <Button size="lg" variant="secondary">Get Started Now</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">HandSpeak Innovators</h3>
              <p className="text-sm">Empowering communication through sign language education.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Learn</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Courses</a></li>
                <li><a href="#" className="hover:text-white">Tutorials</a></li>
                <li><a href="#" className="hover:text-white">Practice</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Forums</a></li>
                <li><a href="#" className="hover:text-white">Events</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} HandSpeak Innovators. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}