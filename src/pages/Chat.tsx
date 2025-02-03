import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatHistoryComponent from "@/components/chat/ChatHistory";
import ChatContainer from "@/components/chat/ChatContainer";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const loadChatMessages = async (sessionId: string) => {
    console.log('Loading messages for session:', sessionId);
    const { data: chatMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
      return;
    }

    const formattedMessages: Message[] = chatMessages.map(msg => ({
      id: msg.id,
      message: msg.message,
      role: msg.role as 'user' | 'assistant',
      created_at: new Date(msg.created_at),
    }));

    setMessages(formattedMessages);
  };

  const createNewChat = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to create a new chat",
        variant: "destructive",
      });
      return;
    }

    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert([{
        title: 'New Chat',
        user_id: session.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
      return;
    }

    setCurrentSessionId(newSession.id);
    setChatSessions([newSession, ...chatSessions]);
    setMessages([]);
    toast({
      title: "Success",
      description: "New chat created",
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
      // Fetch chat sessions
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setChatSessions(sessions || []);

      // Create a new session if none exists
      if (sessions?.length === 0) {
        console.log('No existing sessions, creating new one...');
        await createNewChat();
      } else if (sessions && sessions.length > 0 && !currentSessionId) {
        // Set the most recent session as current if no session is selected
        setCurrentSessionId(sessions[0].id);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Load messages when session is selected
  useEffect(() => {
    if (currentSessionId) {
      loadChatMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title: newTitle })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive",
      });
      return false;
    }

    // Refresh chat sessions to show the new title
    const { data: updatedSessions } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (updatedSessions) {
      setChatSessions(updatedSessions);
    }
    return true;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30">
        {/* Sidebar - hidden on mobile by default */}
        <div className={`${isMobile ? 'hidden' : 'block'}`}>
          <Sidebar>
            <SidebarHeader className="p-4 space-y-2">
              <Button
                onClick={createNewChat}
                variant="default"
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Chat History</SidebarGroupLabel>
                <SidebarGroupContent>
                  <ChatHistoryComponent
                    chatHistories={chatSessions}
                    currentChatId={currentSessionId}
                    setChatHistories={setChatSessions}
                    setCurrentChatId={setCurrentSessionId}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </div>

        {/* Mobile header - only shown on mobile */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b p-4 flex justify-between items-center">
            <Button
              onClick={createNewChat}
              variant="ghost"
              size="icon"
              className="w-8 h-8"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="icon"
              className="w-8 h-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}

        <ChatContainer
          messages={messages}
          setMessages={setMessages}
          currentChatId={currentSessionId}
          updateChatTitle={updateSessionTitle}
        />
      </div>
    </SidebarProvider>
  );
};

export default Chat;