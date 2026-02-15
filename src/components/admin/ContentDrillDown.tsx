import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight, Video, FileText, BookOpen, Search, Download, Filter,
  Trash2, ExternalLink, Eye, CheckCircle, Upload, ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContentDrillDownProps {
  coursesList: any[];
  onNavigateToUpload: (courseId: string, chapterId: string) => void;
  onRefresh: () => void;
}

type ContentTypeFilter = "all" | "VIDEO" | "PDF" | "DPP" | "NOTES" | "TEST";

const ContentDrillDown = ({ coursesList, onNavigateToUpload, onRefresh }: ContentDrillDownProps) => {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonSearch, setLessonSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>("all");
  const [loading, setLoading] = useState(false);

  // Inline edit state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState({
    title: "", video_url: "", lecture_type: "VIDEO", chapter_id: "",
    description: "", position: "0", is_locked: false,
  });
  const [editChaptersList, setEditChaptersList] = useState<any[]>([]);

  const selectedCourse = coursesList.find(c => c.id === selectedCourseId);

  // Fetch chapters when course selected
  useEffect(() => {
    if (!selectedCourseId) { setChapters([]); return; }
    setLoading(true);
    const fetch = async () => {
      const { data } = await supabase
        .from("chapters").select("*")
        .eq("course_id", selectedCourseId)
        .order("position", { ascending: true });
      setChapters(data || []);
      setLoading(false);
    };
    fetch();
  }, [selectedCourseId]);

  // Fetch lessons when chapter selected (or all for course)
  useEffect(() => {
    if (!selectedCourseId || !selectedChapterId) { setLessons([]); return; }
    setLoading(true);
    const fetch = async () => {
      let query = supabase.from("lessons").select("*");
      if (selectedChapterId === "__all__") {
        query = query.eq("course_id", selectedCourseId);
      } else {
        query = query.eq("chapter_id", selectedChapterId);
      }
      const { data } = await query.order("position", { ascending: true });
      setLessons(data || []);
      setLoading(false);
    };
    fetch();
  }, [selectedCourseId, selectedChapterId]);

  // Get lesson counts per chapter
  const [chapterLessonCounts, setChapterLessonCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!selectedCourseId || chapters.length === 0) return;
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const ch of chapters) {
        const { count } = await supabase
          .from("lessons").select("*", { count: "exact", head: true })
          .eq("chapter_id", ch.id);
        counts[ch.id] = count || 0;
      }
      setChapterLessonCounts(counts);
    };
    fetchCounts();
  }, [selectedCourseId, chapters]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchesSearch = l.title?.toLowerCase().includes(lessonSearch.toLowerCase());
      const matchesType = typeFilter === "all" || l.lecture_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [lessons, lessonSearch, typeFilter]);

  const typeCounts = useMemo(() => ({
    all: lessons.length,
    VIDEO: lessons.filter(l => l.lecture_type === "VIDEO").length,
    PDF: lessons.filter(l => l.lecture_type === "PDF").length,
    DPP: lessons.filter(l => l.lecture_type === "DPP").length,
    NOTES: lessons.filter(l => l.lecture_type === "NOTES").length,
    TEST: lessons.filter(l => l.lecture_type === "TEST").length,
  }), [lessons]);

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (!error) {
      toast.success("Deleted");
      setLessons(prev => prev.filter(l => l.id !== id));
      onRefresh();
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setEditLessonData({
      title: lesson.title || "",
      video_url: lesson.video_url || "",
      lecture_type: lesson.lecture_type || "VIDEO",
      chapter_id: lesson.chapter_id || "",
      description: lesson.description || "",
      position: String(lesson.position || 0),
      is_locked: lesson.is_locked || false,
    });
    setEditChaptersList(chapters);
  };

  const handleSaveLessonEdit = async () => {
    if (!editingLessonId) return;
    const { error } = await supabase.from("lessons").update({
      title: editLessonData.title,
      video_url: editLessonData.video_url,
      lecture_type: editLessonData.lecture_type,
      chapter_id: editLessonData.chapter_id || null,
      description: editLessonData.description || null,
      position: parseInt(editLessonData.position) || 0,
      is_locked: editLessonData.is_locked,
    }).eq("id", editingLessonId);
    if (error) toast.error(error.message);
    else {
      toast.success("Lesson updated!");
      setEditingLessonId(null);
      // Refresh lessons
      setSelectedChapterId(prev => { const v = prev; setSelectedChapterId(null); setTimeout(() => setSelectedChapterId(v), 0); return prev; });
      onRefresh();
    }
  };

  const typeIcon = (type: string) => {
    if (type === "VIDEO") return <Video className="h-4 w-4" />;
    if (type === "TEST") return <ClipboardCheck className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const typeColor = (type: string) => {
    if (type === "VIDEO") return "bg-blue-100 text-blue-600";
    if (type === "PDF") return "bg-orange-100 text-orange-600";
    if (type === "DPP") return "bg-green-100 text-green-600";
    if (type === "NOTES") return "bg-purple-100 text-purple-600";
    if (type === "TEST") return "bg-red-100 text-red-600";
    return "bg-gray-100 text-gray-600";
  };

  const tabs: { id: ContentTypeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "VIDEO", label: "Video" },
    { id: "PDF", label: "PDF" },
    { id: "DPP", label: "DPP" },
    { id: "NOTES", label: "Notes" },
    { id: "TEST", label: "Test" },
  ];

  // === BREADCRUMB ===
  const renderBreadcrumb = () => (
    <nav className="flex items-center gap-1.5 text-sm mb-4 flex-wrap">
      <button
        onClick={() => { setSelectedCourseId(null); setSelectedChapterId(null); }}
        className={cn(
          "hover:text-primary transition-colors",
          !selectedCourseId ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        All Courses
      </button>
      {selectedCourse && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <button
            onClick={() => setSelectedChapterId(null)}
            className={cn(
              "hover:text-primary transition-colors",
              !selectedChapterId ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {selectedCourse.title}
          </button>
        </>
      )}
      {selectedChapterId && selectedChapterId !== "__all__" && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-foreground">
            {chapters.find(c => c.id === selectedChapterId)?.title || "Chapter"}
          </span>
        </>
      )}
      {selectedChapterId === "__all__" && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-foreground">All Lessons</span>
        </>
      )}
    </nav>
  );

  // === LEVEL 1: Course Grid ===
  if (!selectedCourseId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <p className="text-sm text-muted-foreground">Select a course to manage its content</p>
        </CardHeader>
        <CardContent>
          {renderBreadcrumb()}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesList.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className="p-4 border rounded-xl bg-white hover:border-primary hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Grade {course.grade} • ₹{course.price}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {coursesList.length === 0 && (
              <p className="text-center text-muted-foreground py-10 col-span-full">No courses found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // === LEVEL 2: Chapter List ===
  if (!selectedChapterId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{selectedCourse?.title}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateToUpload(String(selectedCourseId), "")}
            >
              <Upload className="h-4 w-4 mr-1" /> Upload Here
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderBreadcrumb()}

          {/* All Lessons button */}
          <button
            onClick={() => setSelectedChapterId("__all__")}
            className="w-full p-4 border rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">All Lessons</p>
                  <p className="text-xs text-muted-foreground">View all content for this course</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading chapters...</p>
          ) : chapters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No chapters found for this course.</p>
          ) : (
            <div className="space-y-3">
              {chapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className="w-full p-4 border rounded-xl bg-white hover:border-primary hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {ch.code || ch.position || "—"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ch.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {chapterLessonCounts[ch.id] ?? "..."} lessons
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // === LEVEL 3: Lessons with type tabs ===
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <CardTitle className="text-base">
            {selectedChapterId === "__all__"
              ? `${selectedCourse?.title} — All Lessons`
              : chapters.find(c => c.id === selectedChapterId)?.title || "Chapter"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateToUpload(String(selectedCourseId), selectedChapterId === "__all__" ? "" : selectedChapterId)}
            >
              <Upload className="h-4 w-4 mr-1" /> Upload Here
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderBreadcrumb()}

        {/* Type filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                typeFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                typeFilter === tab.id ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {typeCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search lessons..."
            value={lessonSearch}
            onChange={(e) => setLessonSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lessons list */}
        <ScrollArea className="h-[450px]">
          {loading ? (
            <p className="text-center text-muted-foreground py-10">Loading...</p>
          ) : filteredLessons.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No content found.</p>
          ) : (
            <div className="space-y-2">
              {filteredLessons.map(l => (
                <div key={l.id} className="p-3 border rounded-lg bg-white">
                  {editingLessonId === l.id ? (
                    <div className="space-y-2">
                      <Input value={editLessonData.title} onChange={e => setEditLessonData({ ...editLessonData, title: e.target.value })} placeholder="Title" />
                      <Input value={editLessonData.video_url} onChange={e => setEditLessonData({ ...editLessonData, video_url: e.target.value })} placeholder="URL" />
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={editLessonData.lecture_type} onValueChange={v => setEditLessonData({ ...editLessonData, lecture_type: v })}>
                          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIDEO">Video</SelectItem>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="DPP">DPP</SelectItem>
                            <SelectItem value="NOTES">Notes</SelectItem>
                            <SelectItem value="TEST">Test</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" value={editLessonData.position} onChange={e => setEditLessonData({ ...editLessonData, position: e.target.value })} placeholder="Position" />
                      </div>
                      {editChaptersList.length > 0 && (
                        <Select value={editLessonData.chapter_id} onValueChange={v => setEditLessonData({ ...editLessonData, chapter_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Chapter" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Chapter</SelectItem>
                            {editChaptersList.map(ch => <SelectItem key={ch.id} value={ch.id}>{ch.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      <Textarea value={editLessonData.description} onChange={e => setEditLessonData({ ...editLessonData, description: e.target.value })} placeholder="Description" rows={2} />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editLessonData.is_locked} onChange={e => setEditLessonData({ ...editLessonData, is_locked: e.target.checked })} />
                        Locked
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveLessonEdit}><CheckCircle className="h-3 w-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingLessonId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded", typeColor(l.lecture_type))}>
                          {typeIcon(l.lecture_type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{l.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{l.lecture_type || "VIDEO"}</Badge>
                            {l.position > 0 && <span>Pos: {l.position}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {l.video_url && (
                          <a href={l.video_url} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Button size="icon" variant="ghost" className="text-gray-500" onClick={() => handleEditLesson(l)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDeleteLesson(l.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ContentDrillDown;
