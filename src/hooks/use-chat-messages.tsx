
import { useState, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

export const useChatMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConsultComplete, setIsConsultComplete] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);

  // Fetch messages for the current session
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;

      console.log('Loading messages for session:', sessionId);

      try {
        // First, check if the session is marked as finished
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('finished')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error fetching session status:', sessionError);
        } else if (sessionData) {
          // Update the consult complete state based on the finished column
          setIsConsultComplete(sessionData.finished);
          
          // If the session is finished, check if feedback exists
          if (sessionData.finished) {
            const { data: feedbackData, error: feedbackError } = await supabase
              .from('feedback')
              .select('id')
              .eq('session_id', sessionId)
              .maybeSingle();
            
            if (feedbackError) {
              console.error('Error checking feedback existence:', feedbackError);
            } else {
              // Set whether this session has feedback or not
              setHasFeedback(!!feedbackData);
              
              // Only show dialog for completed sessions without feedback
              // For completed sessions with feedback, consider it "dismissed"
              setDialogDismissed(!!feedbackData);
            }
          } else {
            // For ongoing sessions, reset feedback state
            setHasFeedback(false);
            // Reset dialog dismissed state for ongoing sessions
            setDialogDismissed(false);
          }
        }

        // Then fetch the messages for the session
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        if (data) {
          // Process the messages - keep only user messages and writer (assistant) responses
          const validMessages = data
            .filter(msg => {
              // Keep user messages
              if (msg.role === 'user') {
                return true;
              }
              
              // Keep writer messages (assistant messages for the user)
              if (msg.role === 'writer' || msg.role === 'assistant') {
                return true;
              }
              
              return false;
            })
            .map(msg => ({
              id: msg.message_id,
              content: msg.content,
              role: msg.role === 'writer' ? 'assistant' : msg.role, // Map 'writer' role to 'assistant' for UI consistency
              created_at: new Date(msg.content ? msg.created_at : null),
            }));

          console.log('Processed messages:', validMessages);
          setMessages(validMessages);
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      }
    };

    // Reset messages when session changes
    setMessages([]);
    // We don't reset isConsultComplete, dialogDismissed, or hasFeedback here
    // as we'll set them correctly in fetchMessages
    
    fetchMessages();
  }, [sessionId]);

  // Set up a subscription to listen for changes to the chat_sessions table
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to changes on the specific session
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          // Check if the finished status has changed
          const newFinishedStatus = payload.new.finished;
          if (newFinishedStatus !== isConsultComplete) {
            console.log('Session finished status changed:', newFinishedStatus);
            setIsConsultComplete(newFinishedStatus);
            
            // Important: Reset dialog dismissed state when session is newly marked as complete
            if (newFinishedStatus) {
              setDialogDismissed(false);
              // We'll check if feedback exists separately
              checkFeedbackExists(sessionId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isConsultComplete]);

  // Helper function to check if feedback exists for a session
  const checkFeedbackExists = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking feedback existence:', error);
      } else {
        setHasFeedback(!!data);
        // If feedback exists, consider the dialog dismissed
        if (data) {
          setDialogDismissed(true);
        }
      }
    } catch (error) {
      console.error('Error in checkFeedbackExists:', error);
    }
  };

  return {
    messages,
    setMessages,
    isConsultComplete,
    setIsConsultComplete,
    dialogDismissed,
    setDialogDismissed,
    hasFeedback
  };
};
