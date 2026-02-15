 import { useState, useEffect } from "react";
 import { useNavigate, useParams, useSearchParams } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import Header from "@/components/Layout/Header";
 import Sidebar from "@/components/Layout/Sidebar";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
 import { 
 ArrowLeft, Play, FileText, BookOpen, Grid3X3,
Lock, Clock, ChevronRight, Download, Eye, Star, CheckCircle, MessageCircle, Send
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { toast } from "sonner";
import UnifiedVideoPlayer from "@/components/video/UnifiedVideoPlayer";
import { Breadcrumbs } from "@/components/course/Breadcrumbs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
 
 // Types
 interface Lesson {
   id: string;
   title: string;
   video_url: string;
   description: string | null;
   overview: string | null;
   is_locked: boolean | null;
   lecture_type: string | null;
   position: number | null;
   youtube_id: string | null;
   created_at: string | null;
   duration: number | null;
 }
 
 interface Course {
   id: number;
   title: string;
   description: string | null;
   grade: string | null;
   image_url: string | null;
   thumbnail_url: string | null;
 }
 
 type ContentType = "all" | "lectures" | "pdfs" | "dpp" | "notes";
 
 // Tab config
 const tabConfig: { id: ContentType; label: string; icon: React.ElementType }[] = [
   { id: "all", label: "All", icon: Grid3X3 },
   { id: "lectures", label: "Lectures", icon: Play },
   { id: "pdfs", label: "PDFs", icon: FileText },
   { id: "dpp", label: "DPP", icon: BookOpen },
   { id: "notes", label: "Notes", icon: FileText },
 ];
 
 // Type mapping from admin upload categories
 const typeMapping: Record<ContentType, string[]> = {
   all: [],
   lectures: ["VIDEO"],
   pdfs: ["PDF"],
   dpp: ["DPP"],
   notes: ["NOTES"],
 };
 
 const MyCourseDetail = () => {
   const navigate = useNavigate();
   const { courseId } = useParams();
   const [searchParams, setSearchParams] = useSearchParams();
   const { user, profile } = useAuth();
 
   // State
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [course, setCourse] = useState<Course | null>(null);
   const [lessons, setLessons] = useState<Lesson[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<ContentType>("all");
   const [hasPurchased, setHasPurchased] = useState(false);
 
   // Video player state
   const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
   const isPlayerOpen = searchParams.get("lesson") !== null;
  const [activeInfoTab, setActiveInfoTab] = useState("overview");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
 
  // Fetch comments for lesson
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedLesson) return;
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("lesson_id", selectedLesson.id)
        .order("created_at", { ascending: false });
      if (data) setComments(data);
    };
    fetchComments();
  }, [selectedLesson]);

  // Post comment
  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedLesson || !user) return;
    const { error } = await supabase.from("comments").insert({
      lesson_id: selectedLesson.id,
      message: newComment.trim(),
      user_name: profile?.fullName || "Anonymous",
    });
    if (!error) {
      setNewComment("");
      // Refresh comments
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("lesson_id", selectedLesson.id)
        .order("created_at", { ascending: false });
      if (data) setComments(data);
      toast.success("Comment posted!");
    }
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

   // Check admin/teacher
   const isAdminOrTeacher = profile?.role === "admin" || profile?.role === "teacher";
 
   // Fetch course data and lessons
   useEffect(() => {
     const fetchData = async () => {
       if (!courseId) return;
 
       try {
         setLoading(true);
 
         // Fetch course
         const { data: courseData, error: courseError } = await supabase
           .from("courses")
           .select("*")
           .eq("id", Number(courseId))
           .single();
 
         if (courseError) throw courseError;
         setCourse(courseData);
 
         // Check enrollment
         if (user) {
           const { data: enrollment } = await supabase
             .from("enrollments")
             .select("*")
             .eq("user_id", user.id)
             .eq("course_id", Number(courseId))
             .eq("status", "active")
             .maybeSingle();
 
           if (enrollment) setHasPurchased(true);
         }
 
         // Fetch lessons for this course
         const { data: lessonsData, error: lessonsError } = await supabase
           .from("lessons")
           .select("*")
           .eq("course_id", Number(courseId))
           .order("position", { ascending: true });
 
         if (lessonsError) throw lessonsError;
 
         setLessons(
           (lessonsData || []).map((l: any, idx: number) => ({
             ...l,
             lecture_type: l.lecture_type || "VIDEO",
             position: l.position || idx + 1,
           }))
         );
 
       } catch (err) {
         console.error("Error fetching course data:", err);
         toast.error("Could not load course content");
       } finally {
         setLoading(false);
       }
     };
 
     fetchData();
   }, [courseId, user]);
 
   // Handle opening video from URL params
   useEffect(() => {
     const lessonId = searchParams.get("lesson");
     if (lessonId && lessons.length > 0) {
       const lesson = lessons.find(l => l.id === lessonId);
       if (lesson) {
         setSelectedLesson(lesson);
       }
     }
   }, [searchParams, lessons]);
 
   // Filter lessons by active tab
   const filteredLessons = lessons.filter((lesson) => {
     if (activeTab === "all") return true;
     const types = typeMapping[activeTab];
     return types.includes(lesson.lecture_type || "VIDEO");
   });
 
   // Count content by type
   const counts = {
     all: lessons.length,
     lectures: lessons.filter(l => l.lecture_type === "VIDEO").length,
     pdfs: lessons.filter(l => l.lecture_type === "PDF").length,
     dpp: lessons.filter(l => l.lecture_type === "DPP").length,
     notes: lessons.filter(l => l.lecture_type === "NOTES").length,
   };
 
   // Handle content click
   const handleContentClick = (lesson: Lesson) => {
     if (lesson.is_locked && !hasPurchased && !isAdminOrTeacher) {
       toast.error("This content is locked. Please purchase the course.");
       navigate(`/buy-course?id=${courseId}`);
       return;
     }
 
     // For VIDEO, open player
     if (lesson.lecture_type === "VIDEO") {
       setSelectedLesson(lesson);
       setSearchParams({ lesson: lesson.id });
     } else {
       // For PDF/DPP/Notes, open the URL directly
       if (lesson.video_url) {
         window.open(lesson.video_url, "_blank");
       }
     }
   };
 
   // Close player
   const handleClosePlayer = () => {
     setSelectedLesson(null);
     setSearchParams({});
   };
 
   // Get type config
   const getTypeConfig = (type: string | null) => {
     switch (type) {
       case "VIDEO":
         return { icon: Play, label: "VIDEO", color: "bg-primary/10 text-primary border-primary/20" };
       case "PDF":
         return { icon: FileText, label: "PDF", color: "bg-orange-100 text-orange-600 border-orange-200" };
       case "DPP":
         return { icon: BookOpen, label: "DPP", color: "bg-green-100 text-green-600 border-green-200" };
       case "NOTES":
         return { icon: FileText, label: "NOTES", color: "bg-purple-100 text-purple-600 border-purple-200" };
       default:
         return { icon: Play, label: "VIDEO", color: "bg-primary/10 text-primary border-primary/20" };
     }
   };
 
   // Format date
   const formatDate = (dateString: string | null) => {
     if (!dateString) return "";
     return new Date(dateString).toLocaleDateString('en-IN', {
       day: 'numeric',
       month: 'short',
       year: 'numeric'
     });
   };
 
   // Loading state
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Header onMenuClick={() => setSidebarOpen(true)} userName={profile?.fullName || "User"} />
         <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
         <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
           <Skeleton className="h-8 w-48 mb-4" />
           <Skeleton className="h-32 w-full mb-6" />
           <div className="flex gap-2 mb-6">
             {[1, 2, 3, 4, 5].map((i) => (
               <Skeleton key={i} className="h-10 w-24" />
             ))}
           </div>
           <div className="space-y-4">
             {[1, 2, 3].map((i) => (
               <Skeleton key={i} className="h-24 w-full" />
             ))}
           </div>
         </div>
       </div>
     );
   }
 
   // Course not found
   if (!course) {
     return (
       <div className="min-h-screen bg-background flex flex-col">
         <Header onMenuClick={() => setSidebarOpen(true)} userName={profile?.fullName || "User"} />
         <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
         <div className="flex-1 flex items-center justify-center">
           <p className="text-muted-foreground">Course not found</p>
         </div>
       </div>
     );
   }
 
   // Video Player Full Screen Mode
   if (isPlayerOpen && selectedLesson) {
     return (
       <div className="fixed inset-0 z-50 bg-background flex flex-col">
         {/* Player Header */}
         <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
           <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={handleClosePlayer}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <h1 className="font-semibold text-foreground line-clamp-1">
                 {selectedLesson.title}
               </h1>
               <p className="text-xs text-muted-foreground">{course.title}</p>
             </div>
           </div>
         </header>
 
          {/* Video Player - IMMERSIVE: UnifiedVideoPlayer with full masking */}
            <div className="flex-1 bg-black flex flex-col overflow-hidden">
              <div className="w-full">
                <UnifiedVideoPlayer
                  url={selectedLesson.video_url}
                  title={selectedLesson.title}
                  onReady={() => console.log('Video ready')}
                />
              </div>
 
            {/* Lesson Info Tabs Below Video */}
            <ScrollArea className="flex-1 bg-card">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg text-foreground mb-1">
                  {selectedLesson.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedLesson.duration ? `${Math.floor(selectedLesson.duration / 60)}m` : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    4.8 Rating
                  </span>
                </div>
              </div>

              {/* Tab Navigation */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid grid-cols-4 bg-muted/50 rounded-none border-b h-auto py-0">
                  <TabsTrigger value="overview" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-sm">
                    📁 Resources
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-sm">
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="discussion" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-sm">
                    Discussion
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-4 mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">About this lesson</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {selectedLesson.overview || selectedLesson.description || "No overview available for this lesson."}
                      </p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-primary font-medium">You will learn:</p>
                          <p className="text-sm text-muted-foreground">Basic definitions, Real-world examples, and Problem solving.</p>
                        </div>
                      </div>
                    </div>

                    {/* Course Content Progress */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-foreground">Course Content</h3>
                        <span className="text-xs text-muted-foreground">{lessons.length} Lessons</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${100 / lessons.length}%` }} />
                      </div>
                      <div className="space-y-2">
                        {lessons.filter(l => l.lecture_type === "VIDEO").slice(0, 5).map((lesson, idx) => (
                          <button
                            key={lesson.id}
                            onClick={() => { setSelectedLesson(lesson); setSearchParams({ lesson: lesson.id }); }}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                              lesson.id === selectedLesson.id ? "bg-primary/10" : "hover:bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                              lesson.id === selectedLesson.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              <Play className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {lesson.duration ? `${Math.floor(lesson.duration / 60)}m` : "—"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resources" className="p-4 mt-0">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground mb-3">Downloadable Resources</h3>
                    {lessons.filter(l => l.lecture_type === "PDF" || l.lecture_type === "DPP").length > 0 ? (
                      lessons.filter(l => l.lecture_type === "PDF" || l.lecture_type === "DPP").map((material) => (
                        <a
                          key={material.id}
                          href={material.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <FileText className="h-5 w-5 text-orange-500" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{material.title}</p>
                            <p className="text-xs text-muted-foreground">{material.lecture_type}</p>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No resources available for this lesson.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-4 mt-0">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground mb-3">Lecture Notes</h3>
                    {lessons.filter(l => l.lecture_type === "NOTES").length > 0 ? (
                      lessons.filter(l => l.lecture_type === "NOTES").map((note) => (
                        <a
                          key={note.id}
                          href={note.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <FileText className="h-5 w-5 text-purple-500" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{note.title}</p>
                            <p className="text-xs text-muted-foreground">PDF Notes</p>
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No notes available for this lesson.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="p-4 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Discussion</h3>
                    
                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask a question or share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                      <Button onClick={handlePostComment} size="icon" className="shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground text-sm">{comment.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{comment.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-8">
                          No discussions yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
       <Header onMenuClick={() => setSidebarOpen(true)} userName={profile?.fullName || "User"} />
 
       <main className="flex-1 overflow-y-auto">
         <div className="max-w-7xl mx-auto w-full">
 
            {/* Breadcrumbs */}
            <Breadcrumbs segments={[
              { label: "All Classes", href: "/all-classes" },
              { label: course.title, href: `/classes/${courseId}/chapters` },
              ...(activeTab !== "all" ? [{ label: tabConfig.find(t => t.id === activeTab)?.label || "" }] : []),
            ]} />
 
           {/* Back Button + Course Info */}
           <div className="px-4 py-4 border-b">
             <button 
               onClick={() => navigate("/my-courses")} 
               className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
             >
               <ArrowLeft className="h-4 w-4" />
               <span className="text-sm font-medium">Back to Courses</span>
             </button>
 
             <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
             {course.description && (
               <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
                 {course.description}
               </p>
             )}
           </div>
 
           {/* Tab Navigation */}
           <div className="px-4 pt-4 border-b bg-card sticky top-0 z-10">
             <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
               {tabConfig.map((tab) => {
                 const count = counts[tab.id];
                 const isActive = activeTab === tab.id;
                 const Icon = tab.icon;
 
                 return (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={cn(
                       "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                       isActive 
                         ? "bg-primary text-primary-foreground shadow-sm" 
                         : "bg-muted text-muted-foreground hover:bg-muted/80"
                     )}
                   >
                     <Icon className="h-4 w-4" />
                     {tab.label}
                     {count > 0 && (
                       <span className={cn(
                         "text-xs px-1.5 py-0.5 rounded-full",
                         isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground"
                       )}>
                         {count}
                       </span>
                     )}
                   </button>
                 );
               })}
             </div>
           </div>
 
           {/* Content Grid */}
           <div className="p-4 space-y-4">
             {filteredLessons.length === 0 ? (
               <div className="text-center py-16">
                 <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                 <h3 className="font-semibold text-foreground mb-1">No content available</h3>
                 <p className="text-sm text-muted-foreground">
                   There's no content in this section yet.
                 </p>
               </div>
             ) : (
               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {filteredLessons.map((lesson) => {
                   const typeConfig = getTypeConfig(lesson.lecture_type);
                   const TypeIcon = typeConfig.icon;
                   const isLocked = lesson.is_locked && !hasPurchased && !isAdminOrTeacher;
 
                   return (
                     <div
                       key={lesson.id}
                       onClick={() => handleContentClick(lesson)}
                       className={cn(
                          "group bg-card border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
                         isLocked && "opacity-70"
                       )}
                     >
                       {/* Thumbnail */}
                        <div className="relative aspect-video bg-muted overflow-hidden flex items-center">
                          {/* Left - Thumbnail */}
                         {lesson.lecture_type === "VIDEO" ? (
                           <>
                              {getYouTubeThumbnail(lesson.video_url) ? (
                                <img 
                                  src={getYouTubeThumbnail(lesson.video_url) || ''} 
                                  alt={lesson.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                  <Play className="h-10 w-10 text-white/70" />
                                </div>
                              )}
                              {/* Duration badge */}
                              <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                                {lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : "—"}
                              </div>
                              {/* Play overlay on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                               {isLocked ? (
                                  <Lock className="h-10 w-10 text-white/60 opacity-100" />
                               ) : (
                                  <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                               )}
                             </div>
                             {isLocked && (
                               <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                                 <Lock className="h-3 w-3 mr-1" />
                                 Locked
                               </Badge>
                             )}
                           </>
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                             <TypeIcon className="h-12 w-12 text-muted-foreground/40" />
                           </div>
                         )}
                       </div>
 
                       {/* Content */}
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", typeConfig.color)}>
                                  {typeConfig.label}
                                </Badge>
                                <span>• {formatDate(lesson.created_at)}</span>
                              </div>
                              <h3 className="font-semibold text-foreground line-clamp-2 text-sm group-hover:text-primary transition-colors">
                                {lesson.title}
                              </h3>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline" className="gap-1 flex-1 h-8 text-xs">
                             {lesson.lecture_type === "VIDEO" ? (
                                <><Play className="h-3 w-3" /> Watch Lecture</>
                             ) : (
                                <><Eye className="h-3 w-3" /> View</>
                             )}
                           </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <FileText className="h-4 w-4" />
                            </Button>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default MyCourseDetail;