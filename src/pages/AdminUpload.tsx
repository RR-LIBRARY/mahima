import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload, Video, FileText, LogOut, CheckCircle, Trash2, 
  BookOpen, Shield, Loader2, FileUp, Link as LinkIcon, Eye
} from "lucide-react";
import logo from "@/assets/logo.png";
import MediaPreview from "@/components/admin/MediaPreview";
import { ADMIN_CONFIG } from "@/lib/adminConfig";

const AdminUpload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  // Upload form states
  const [uploadType, setUploadType] = useState<"video" | "pdf">("video");
  const [title, setTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("Mahima Academy");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"PDF" | "DPP" | "NOTES">("PDF");
  const [pdfInputMode, setPdfInputMode] = useState<"file" | "url">("file");
  const [pdfUrl, setPdfUrl] = useState("");

  // Auth check with email verification
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/admin/login');
        return;
      }

      // SECURITY: Verify the email is the authorized admin email
      if (!ADMIN_CONFIG.isAuthorizedAdmin(session.user.email)) {
        toast.error("Access denied. This account is not authorized for admin access.");
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      // Verify admin role in database
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast.error("Access denied. Admin role not found.");
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      // Fetch profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      setUser({ ...session.user, full_name: profile?.full_name || 'Admin' });
      setIsLoading(false);
      fetchData();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [coursesRes, lessonsRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('lessons').select(`*, courses (title)`).order('created_at', { ascending: false })
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (lessonsRes.data) setLessons(lessonsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleUpload = async () => {
    if (!title || !selectedCourse) {
      toast.error("Please fill title and select a course");
      return;
    }

    if (uploadType === "video" && !videoUrl) {
      toast.error("Please enter video URL");
      return;
    }

    if (uploadType === "pdf" && pdfInputMode === "file" && !pdfFile) {
      toast.error("Please select a PDF file");
      return;
    }

    if (uploadType === "pdf" && pdfInputMode === "url" && !pdfUrl) {
      toast.error("Please enter a URL");
      return;
    }

    setIsUploading(true);
    try {
      let contentUrl = "";

      if (uploadType === "pdf" && pdfInputMode === "url") {
        contentUrl = pdfUrl;
      } else if (uploadType === "pdf" && pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `lessons/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('content')
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('content')
          .getPublicUrl(filePath);

        contentUrl = publicUrl;
      } else {
        contentUrl = videoUrl;
      }

      const { data: newLesson, error } = await supabase.from('lessons').insert({
        course_id: parseInt(selectedCourse),
        title: title,
        video_url: contentUrl,
        description: null,
        overview: watermarkText || null,
        is_locked: true,
        lecture_type: uploadType === "video" ? "VIDEO" : selectedCategory
      }).select().single();

      if (error) throw error;

      toast.success("Content uploaded successfully! Redirecting to preview...");
      
      // Reset form
      setTitle("");
      setVideoUrl("");
      setSelectedCourse("");
      setPdfFile(null);
      
      // Auto-redirect to lesson view after successful upload
      if (newLesson?.id) {
        setTimeout(() => {
          navigate(`/lesson/${newLesson.id}`);
        }, 1000);
      } else {
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Lesson deleted");
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Mahima Academy" className="h-10 w-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Admin Upload Center
              </h1>
              <p className="text-sm text-purple-300">Welcome, {user?.full_name || 'Admin'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="text-white border-white/30 hover:bg-white/10">
              Full Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Upload className="h-5 w-5" />
                Upload New Material
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={uploadType === "video" ? "default" : "outline"}
                    className={uploadType === "video" ? "bg-purple-600 hover:bg-purple-500" : ""}
                    onClick={() => setUploadType("video")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                  <Button
                    type="button"
                    variant={uploadType === "pdf" && selectedCategory === "PDF" ? "default" : "outline"}
                    className={uploadType === "pdf" && selectedCategory === "PDF" ? "bg-orange-600 hover:bg-orange-500" : ""}
                    onClick={() => { setUploadType("pdf"); setSelectedCategory("PDF"); }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant={uploadType === "pdf" && selectedCategory === "DPP" ? "default" : "outline"}
                    className={uploadType === "pdf" && selectedCategory === "DPP" ? "bg-green-600 hover:bg-green-500" : ""}
                    onClick={() => { setUploadType("pdf"); setSelectedCategory("DPP"); }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    DPP
                  </Button>
                  <Button
                    type="button"
                    variant={uploadType === "pdf" && selectedCategory === "NOTES" ? "default" : "outline"}
                    className={uploadType === "pdf" && selectedCategory === "NOTES" ? "bg-blue-600 hover:bg-blue-500" : ""}
                    onClick={() => { setUploadType("pdf"); setSelectedCategory("NOTES"); }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Notes
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Physics Laws of Motion - Chapter 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {course.title} ({course.grade})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video URL or PDF Upload */}
              {uploadType === "video" ? (
                <div className="space-y-3">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="videoUrl"
                      placeholder="https://youtube.com/watch?v=... or Vimeo link"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, and direct video links</p>
                  {/* Video Preview Button */}
                  {videoUrl && (
                    <div className="pt-2">
                      <MediaPreview url={videoUrl} type="video" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Upload {selectedCategory}</Label>
                    <div className="flex gap-1 bg-muted rounded-md p-0.5">
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded ${pdfInputMode === 'file' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setPdfInputMode("file")}
                      >
                        <FileUp className="h-3 w-3 inline mr-1" />File
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded ${pdfInputMode === 'url' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                        onClick={() => setPdfInputMode("url")}
                      >
                        <LinkIcon className="h-3 w-3 inline mr-1" />URL
                      </button>
                    </div>
                  </div>
                  {pdfInputMode === "file" ? (
                    <>
                      <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                        <input
                          id="pdfFile"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label htmlFor="pdfFile" className="cursor-pointer">
                          <FileUp className="h-10 w-10 mx-auto text-purple-400 mb-2" />
                          {pdfFile ? (
                            <p className="text-purple-700 font-medium">{pdfFile.name}</p>
                          ) : (
                            <p className="text-gray-500">Click to select PDF file</p>
                          )}
                        </label>
                      </div>
                      {pdfFile && (
                        <div className="pt-2">
                          <MediaPreview file={pdfFile} type="pdf" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Paste direct link to PDF/document..."
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        className="h-12 pl-10"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Overview */}
              <div className="space-y-2">
                <Label htmlFor="overview">Lesson Overview</Label>
                <textarea
                  id="overview"
                  placeholder="Write a brief overview of this lesson for students..."
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Uploads ({lessons.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {lessons.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No lessons uploaded yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              lesson.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {lesson.type === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{lesson.title}</h4>
                              <p className="text-sm text-muted-foreground">{lesson.courses?.title || 'Unknown Course'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {lesson.type === 'video' ? 'Video' : 'PDF'}
                                </Badge>
                                {lesson.is_locked && (
                                  <Badge variant="outline" className="text-xs">Locked</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminUpload;
