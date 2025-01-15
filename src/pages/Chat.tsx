import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import ThreeScene from "@/components/chat/ThreeScene";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
      // Fetch chat histories
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      setChatHistories(chats);

      // Create a new chat if none exists
      if (!currentChatId) {
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert([{
            user_id: session.user.id,  // Add the user_id here
            title: 'New Chat'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating chat:', createError);
          return;
        }

        setCurrentChatId(newChat.id);
      }
    };

    checkAuth();
  }, [navigate, currentChatId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChatId) return;

    const newMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user' as const,
      timestamp: new Date(),
    };

    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        chat_id: currentChatId,
        content: inputMessage,
        sender: 'user'
      }]);

    if (messageError) {
      console.error('Error saving message:', messageError);
      return;
    }

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    setIsProcessing(true);
    isThinkingRef.current = true;

    // Simulate API response with audio data
    setTimeout(() => {
      const agentResponse = {
        id: (Date.now() + 1).toString(),
        content: "This is a placeholder response. Connect your backend to get real responses.",
        sender: 'agent' as const,
        timestamp: new Date(),
      };
      
      // Save agent response to database
      supabase
        .from('messages')
        .insert([{
          chat_id: currentChatId,
          content: agentResponse.content,
          sender: 'agent'
        }])
        .then(({ error }) => {
          if (error) console.error('Error saving agent response:', error);
        });

      const simulatedAudioData = Array.from({ length: 32 }, () => Math.random() * 0.5);
      setAudioData(simulatedAudioData);
      
      setMessages(prev => [...prev, agentResponse]);
      setIsProcessing(false);
      isThinkingRef.current = false;

      setTimeout(() => setAudioData([]), 3000);
    }, 2000);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-purple-50/30">
        <Sidebar>
          <SidebarHeader className="p-4">
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
                <SidebarMenu>
                  {chatHistories.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        onClick={() => setCurrentChatId(chat.id)}
                        isActive={currentChatId === chat.id}
                      >
                        {chat.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="w-full max-w-[500px] mx-auto">
              <ThreeScene isThinking={isThinkingRef.current} audioData={audioData} />
            </div>
            
            <Card className="p-6 bg-white/20 backdrop-blur-xl border-purple-100/50 shadow-xl rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <ChatMessages messages={messages} />
                <ChatInput
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSendMessage={handleSendMessage}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Chat;