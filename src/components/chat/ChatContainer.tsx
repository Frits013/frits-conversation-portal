
import { useState, useRef, useCallback, useEffect } from "react";
import InterviewProgress from "./InterviewProgress";
import { ChatMessage } from "@/types/chat";
import ConsultCompleteDialog from "@/components/chat/ConsultCompleteDialog";
import { useToast } from "@/hooks/use-toast";
import ChatPanelLayout from "./ChatPanelLayout";

import ChatPanel from "./ChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";

import { useSessionAnimations } from "@/hooks/chat/use-session-animations";

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
  onSessionAnimation?: (shouldAnimate: boolean, sessionId?: string) => void;
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
  onSessionAnimation,
}: ChatContainerProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const isMobile = useIsMobile();
  
  // Add a new state to track whether the complete button is showing
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const isThinkingRef = useRef(false);

  // Use the session animations hook
  const { shouldTriggerAnimation, startSessionAnimation } = useSessionAnimations(showCompleteButton);

  // Button visibility logic - show when session is marked as finished in database but not yet completed by user
  useEffect(() => {
    console.log('Button visibility check:', {
      isConsultComplete,
      hasFeedback,
      dialogDismissed
    });
    
    // Show the button when:
    // 1. Session is marked as finished in database (isConsultComplete)
    // 2. User hasn't completed the process yet (no feedback exists)
    const shouldShowButton = isConsultComplete && !hasFeedback;
    
    console.log('Should show complete button:', shouldShowButton);
    setShowCompleteButton(shouldShowButton);
  }, [isConsultComplete, hasFeedback]);

  // Trigger session animation when button appears
  useEffect(() => {
    if (shouldTriggerAnimation && currentChatId && onSessionAnimation) {
      console.log('Triggering session animation for:', currentChatId);
      onSessionAnimation(true, currentChatId);
      startSessionAnimation(currentChatId);
    }
  }, [shouldTriggerAnimation, currentChatId, onSessionAnimation, startSessionAnimation]);

  // Handle when user clicks the finish interview button
  const handleCompleteButtonClick = useCallback(() => {
    console.log('Complete button clicked - showing dialog');
    if (currentChatId) {
      setShowCompleteDialog(true);
    }
  }, [currentChatId]);

  // Handle when user confirms finishing the session via the dialog
  const handleFinishConsult = () => {
    console.log('User confirmed finishing consult session');
    if (currentChatId) {
      // Mark the session as finished by the user (this will move it to completed section)
      onConsultFinish(currentChatId);
      toast({
        title: "Success",
        description: "Consult session completed successfully",
      });
    }
    setShowCompleteDialog(false);
  };

  // Handle when user chooses to continue chatting (closes dialog without ending)
  const handleContinueChat = () => {
    console.log('User closed dialog without ending session - session stays active');
    setShowCompleteDialog(false);
    // Note: We do NOT call onConsultFinish here - session stays active
  };

  // Calculate interview progress
  const userMessages = messages.filter(msg => msg.role === 'user');
  const totalQuestions = 10; // Estimate total questions for interview
  const answeredQuestions = userMessages.length;
  const progress = Math.min((answeredQuestions / totalQuestions) * 100, 100);
  
  const getPhase = (progress: number) => {
    if (progress < 25) return 'Introduction';
    if (progress < 50) return 'Core Questions';
    if (progress < 75) return 'Summary';
    return 'Conclusion';
  };

  const currentPhase = getPhase(progress);
  const estimatedTimeLeft = progress < 100 ? `${Math.max(1, Math.ceil((100 - progress) / 10))} min` : undefined;

  return (
    <>
      <ChatPanelLayout>
        <div className="flex flex-col h-full">
          {/* Interview Progress - positioned at the top */}
          {messages.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2">
              <InterviewProgress
                currentPhase={currentPhase}
                progress={progress}
                totalQuestions={totalQuestions}
                answeredQuestions={answeredQuestions}
                estimatedTimeLeft={estimatedTimeLeft}
              />
            </div>
          )}
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel
              defaultSize={100}
              minSize={isMobile ? 40 : 30}
              messages={messages}
              setMessages={setMessages}
              currentChatId={currentChatId}
              setErrorMessage={setErrorMessage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              isThinkingRef={isThinkingRef}
              errorMessage={errorMessage}
              showCompleteButton={showCompleteButton}
              onCompleteButtonClick={handleCompleteButtonClick}
            />
          </div>
        </div>
      </ChatPanelLayout>

      <ConsultCompleteDialog
        open={showCompleteDialog}
        onClose={handleContinueChat}
        onFinish={handleFinishConsult}
        sessionId={currentChatId}
      />
    </>
  );
};

export default ChatContainer;
