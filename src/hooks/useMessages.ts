import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageWithProfiles extends Message {
  sender?: {
    fullName: string | null;
    email: string | null;
  };
  recipient?: {
    fullName: string | null;
    email: string | null;
  };
}

export interface MessageInput {
  recipientId: string;
  subject: string;
  content: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<MessageWithProfiles[]>([]);
  const [sent, setSent] = useState<MessageWithProfiles[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const data = await apiGet<any[]>('/api/messages');

      const formatMessages = (messages: any[]): MessageWithProfiles[] => 
        messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          recipientId: m.recipientId,
          subject: m.subject,
          content: m.content,
          isRead: m.isRead,
          createdAt: m.createdAt,
        }));

      const allMessages = formatMessages(data || []);
      const userId = user?.id;
      const inboxMessages = allMessages.filter(m => m.recipientId === userId);
      const sentMessages = allMessages.filter(m => m.senderId === userId);

      setInbox(inboxMessages);
      setSent(sentMessages);
      setUnreadCount(inboxMessages.filter((m) => !m.isRead).length);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchInbox = fetchMessages;
  const fetchSent = fetchMessages;

  const sendMessage = useCallback(async (input: MessageInput): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to send messages");
      return false;
    }

    try {
      await apiPost('/api/messages', input);

      toast.success("Message sent successfully!");
      await fetchMessages();
      return true;
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(err.message || "Failed to send message");
      return false;
    }
  }, [user, fetchMessages]);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      await apiPatch(`/api/messages/${messageId}/read`);
      await fetchMessages();
    } catch (err: any) {
      console.error("Error marking message as read:", err);
    }
  }, [fetchMessages]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      toast.success("Message deleted!");
      await fetchMessages();
      return true;
    } catch (err: any) {
      console.error("Error deleting message:", err);
      toast.error(err.message || "Failed to delete message");
      return false;
    }
  }, [fetchMessages]);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, fetchMessages]);

  return {
    inbox,
    sent,
    unreadCount,
    loading,
    error,
    fetchInbox,
    fetchSent,
    sendMessage,
    markAsRead,
    deleteMessage,
  };
};
