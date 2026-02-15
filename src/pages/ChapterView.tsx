import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { Breadcrumbs, ChapterCard } from "@/components/course";

interface Chapter {
  id: string;
  code: string;
  title: string;
  description: string | null;
  position: number;
  lessonCount: number;
  completedLessons: number;
}

interface Course {
  id: number;
  title: string;
  grade: string | null;
}

const ChapterView = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chapters" | "material">("chapters");

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, title, grade")
          .eq("id", Number(courseId))
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch chapters with lesson counts
        const { data: chaptersData, error: chaptersError } = await supabase
          .from("chapters")
          .select(`
            id,
            code,
            title,
            description,
            position,
            lessons(id)
          `)
          .eq("course_id", Number(courseId))
          .order("position", { ascending: true });

        if (chaptersError) throw chaptersError;

        // If no chapters exist, create virtual chapters from lessons
        if (!chaptersData || chaptersData.length === 0) {
          // No chapters — we'll show all lessons directly on this page
          // by creating a single virtual "All Content" chapter
          setChapters([{
            id: "__all__",
            code: "ALL",
            title: "All Content",
            description: "All lectures and materials for this course",
            position: 0,
            lessonCount: 0,
            completedLessons: 0,
          }]);
        } else {
          const formattedChapters: Chapter[] = chaptersData.map((c: any) => ({
            id: c.id,
            code: c.code,
            title: c.title,
            description: c.description,
            position: c.position,
            lessonCount: c.lessons?.length || 0,
            completedLessons: 0,
          }));

          setChapters(formattedChapters);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) {
    return <LoadingSpinner fullPage size="lg" text="Loading chapters..." />;
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const breadcrumbSegments = [
    { label: "All Classes", href: "/all-classes" },
    { label: course.title, href: `/classes/${courseId}/chapters` },
    { label: "Overview Syllabus" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-3 sticky top-0 z-20 bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/all-classes")}
            className="text-primary hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">{course.title}</h1>
        </div>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs segments={breadcrumbSegments} className="sticky top-[60px] z-10" />

      {/* Tab Bar */}
      <div className="flex gap-6 px-5 border-b border-border">
        <button
          onClick={() => setActiveTab("chapters")}
          className={cn(
            "pb-3 text-base font-medium relative transition-colors",
            activeTab === "chapters" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Chapters
          {activeTab === "chapters" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("material")}
          className={cn(
            "pb-3 text-base font-medium relative transition-colors",
            activeTab === "material" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Study Material
          {activeTab === "material" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {activeTab === "chapters" &&
          chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              code={chapter.code}
              title={chapter.title}
              lectureCount={chapter.lessonCount}
              completedLectures={chapter.completedLessons}
              onClick={() => {
                if (chapter.id === "__all__") {
                  // No real chapters — go to lecture listing for entire course
                  navigate(`/classes/${courseId}/chapter/__all__`);
                } else {
                  navigate(`/classes/${courseId}/chapter/${chapter.id}`);
                }
              }}
            />
          ))}

        {activeTab === "material" && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No study material available yet.</p>
          </div>
        )}

        {activeTab === "chapters" && chapters.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No chapters available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterView;
