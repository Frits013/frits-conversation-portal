
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "@/types/chat";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";
import { useToast } from "@/hooks/use-toast";
import ChatVisualizer from "./ChatVisualizer";
import ChatMessagesContainer from "./ChatMessagesContainer";
import ChatInputContainer from "./ChatInputContainer";
import { useEffect } from "react";

interface ChatContainerProps {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  currentChatId: string | null;
  updateChatTitle: (chatId: string, newTitle: string) => Promise<boolean>;
  isConsultComplete: boolean;
  setIsConsultComplete: (isComplete: boolean) => void;
  onConsultFinish: (sessionId: string) => void;
  dialogDismissed: boolean;
  setDialogDismissed: (dismissed: boolean) => void;
  hasFeedback?: boolean;
}

const ChatContainer = ({
  messages,
  setMessages,
  currentChatId,
  updateChatTitle,
  isConsultComplete,
  setIsConsultComplete,
  onConsultFinish,
  dialogDismissed,
  setDialogDismissed,
  hasFeedback = false,
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isThinkingRef = useRef(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // Watch for changes in isConsultComplete to show dialog
  useEffect(() => {
    if (isConsultComplete && !dialogDismissed && !hasFeedback) {
      // Only show dialog for completed sessions without feedback
      // and that haven't been dismissed
      setShowCompleteDialog(true);
    } else {
      // Hide dialog in all other cases
      setShowCompleteDialog(false);
    }
  }, [isConsultComplete, dialogDismissed, currentChatId, hasFeedback]);

  const handleFinishConsult = () => {
    if (currentChatId) {
      // Call onConsultFinish only when the user confirms by clicking "End Session"
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session marked as complete",
      });
    }
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  const handleContinueChat = () => {
    setShowCompleteDialog(false);
    setDialogDismissed(true);
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full">
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        <ChatVisualizer 
          isThinking={isThinkingRef.current} 
          audioData={audioData} 
        />
        
        <Card className="flex-1 flex flex-col bg-white/20 backdrop-blur-xl border-purple-100/50 shadow-xl rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 pointer-events-none" />
          
          <ChatMessagesContainer 
            messages={messages} 
            errorMessage={errorMessage} 
          />
          
          <ChatInputContainer
            messages={messages}
            setMessages={setMessages}
            currentChatId={currentChatId}
            setErrorMessage={setErrorMessage}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            isThinkingRef={isThinkingRef}
          />
        </Card>
      </div>

      <ConsultCompleteDialog
        open={showCompleteDialog}
        onClose={handleContinueChat}
        onFinish={handleFinishConsult}
        sessionId={currentChatId}
      />
    </div>
  );
};

export default ChatContainer;
