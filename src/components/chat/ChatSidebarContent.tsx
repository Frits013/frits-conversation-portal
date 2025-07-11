
import { SidebarContent } from "@/components/ui/sidebar";
import ChatSessionsSection from "./ChatSessionsSection";
import { SessionWithFeedback } from "@/types/chat";
import { AnimatePresence } from "framer-motion";

interface ChatSidebarContentProps {
  ongoingConsults: SessionWithFeedback[];
  finishableConsults: SessionWithFeedback[];
  completedConsults: SessionWithFeedback[];
  currentSessionId: string | null;
  onSessionsUpdate: (sessions: SessionWithFeedback[]) => void;
  onSessionSelect: (id: string | null) => void;
  animationState?: {
    shouldAnimate: boolean;
    sessionId?: string;
  };
}

const ChatSidebarContent = ({
  ongoingConsults,
  finishableConsults,
  completedConsults,
  currentSessionId,
  onSessionsUpdate,
  onSessionSelect,
  animationState
}: ChatSidebarContentProps) => {
  return (
    <SidebarContent className="flex-1 min-h-0 overflow-hidden">
      <div className="h-full flex flex-col px-3 py-4 space-y-6 overflow-hidden">
        {/* Ongoing consults section */}
        <ChatSessionsSection
          title="Ongoing Consults"
          sessions={ongoingConsults}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          emptyMessage="No ongoing consults"
          emptySubMessage="Start a new consultation above"
          animationState={animationState}
        />

        {/* Finishable consults section */}
        <ChatSessionsSection
          title="Finishable Consults"
          sessions={finishableConsults}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          titleColor="text-amber-700 dark:text-amber-300"
          animationState={animationState}
        />

        {/* Completed consults section */}
        <ChatSessionsSection
          title="Completed Consults"
          sessions={completedConsults}
          currentSessionId={currentSessionId}
          onSessionsUpdate={onSessionsUpdate}
          onSessionSelect={onSessionSelect}
          titleColor="text-slate-600 dark:text-slate-400"
          animationState={animationState}
        />
      </div>
    </SidebarContent>
  );
};

export default ChatSidebarContent;
