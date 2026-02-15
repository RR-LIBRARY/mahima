/**
 * Messages.tsx
 * =============
 * Internal messaging page for students and teachers.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  ArrowLeft, Inbox, Send, Mail, MailOpen, Trash2, 
  PenSquare, Loader2, MessageCircle 
} from "lucide-react";

const Messages = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { 
    inbox, sent, unreadCount, loading, 
    sendMessage, markAsRead, deleteMessage 
  } = useMessages();
  
  // Compose form state
  const [showCompose, setShowCompose] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Handle send message
  const handleSend = async () => {
    if (!recipientId || !subject || !content) {
      toast.error("Please fill all fields");
      return;
    }
    
    setSending(true);
    const success = await sendMessage({ recipientId, subject, content });
    setSending(false);
    
    if (success) {
      setShowCompose(false);
      setRecipientId("");
      setSubject("");
      setContent("");
    }
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
          <h1 className="text-lg font-semibold text-primary-foreground">Messages</h1>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => setShowCompose(true)}
        >
          <PenSquare className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      <main className="flex-1 p-4 space-y-4">
        {/* Compose Modal/Card */}
        {showCompose && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PenSquare className="h-5 w-5 text-primary" />
                New Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Recipient User ID (for demo purposes)"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
              />
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                placeholder="Write your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCompose(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSend} 
                  disabled={sending}
                  className="flex-1"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages Tabs */}
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              Inbox ({inbox.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent ({sent.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <Card>
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : inbox.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No messages in your inbox</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {inbox.map((message) => (
                      <div 
                        key={message.id} 
                        className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !message.isRead ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(message.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {message.isRead ? (
                                <MailOpen className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Mail className="h-4 w-4 text-primary" />
                              )}
                              <h4 className={`font-medium truncate ${!message.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {message.subject}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <ScrollArea className="h-[400px]">
                {sent.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No sent messages</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {sent.map((message) => (
                      <div key={message.id} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{message.subject}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMessage(message.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Messages;
