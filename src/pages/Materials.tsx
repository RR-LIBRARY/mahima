/**
 * Materials.tsx
 * ==============
 * Study materials and resources page.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaterials } from "@/hooks/useMaterials";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, FileText, Download, Upload, Loader2, 
  Trash2, File, FileImage, FileVideo, Plus 
} from "lucide-react";

const Materials = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isTeacher, isLoading: authLoading } = useAuth();
  const { materials, loading, uploading, uploadMaterial, deleteMaterial } = useMaterials();
  const { courses } = useCourses();
  
  // Upload form state
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const canManage = isAdmin || isTeacher;

  // Handle upload
  const handleUpload = async () => {
    if (!title || !file) return;
    
    const success = await uploadMaterial({
      title,
      courseId: selectedCourse ? parseInt(selectedCourse) : undefined,
      file,
    });
    
    if (success) {
      setShowUpload(false);
      setTitle("");
      setSelectedCourse("");
      setFile(null);
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) return <FileImage className="h-5 w-5 text-green-500" />;
    if (['mp4', 'webm', 'mov'].includes(fileType)) return <FileVideo className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  // Format file size
  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Auth redirect
  if (!authLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Page Header */}
      <div className="bg-primary px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-primary-foreground">Materials</h1>
        </div>
        {canManage && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        )}
      </div>

      <main className="flex-1 p-4 space-y-4">
        {/* Upload Form */}
        {showUpload && canManage && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Upload Material
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Material title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Course (Optional)</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {file ? (
                      <p className="text-primary font-medium">{file.name}</p>
                    ) : (
                      <p className="text-muted-foreground">Click to select file</p>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpload(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading || !title || !file}
                  className="flex-1"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials List */}
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No materials uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-muted">
                      {getFileIcon(material.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{material.title}</h4>
                      {material.course && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {material.course.title}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatSize(material.fileSize)} • {material.fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMaterial(material.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Materials;
