import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FASTAPI_URL = "https://demo-fastapi-app.onrender.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chat_id } = await req.json();
    console.log('Received request:', { message, chat_id });

    // If no chat_id is provided, start a new chat session
    let sessionId = chat_id;
    if (!sessionId) {
      console.log('Starting new chat session');
      const startResponse = await fetch(`${FASTAPI_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!startResponse.ok) {
        throw new Error(`Failed to start chat session: ${startResponse.status}`);
      }

      const session = await startResponse.json();
      console.log('New chat session created:', session);
      sessionId = session.id;
    }

    // Send message to FastAPI backend using URL parameters as required by the API
    const url = new URL(`${FASTAPI_URL}/chat/send_message`);
    url.searchParams.append('session_id', sessionId);
    url.searchParams.append('content', message);
    
    console.log('Sending message to FastAPI:', { url: url.toString(), sessionId, message });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('FastAPI error:', response.status);
      const errorText = await response.text();
      throw new Error(`FastAPI responded with status: ${response.status}, error: ${errorText}`);
    }

    const data = await response.json();
    console.log('FastAPI response:', data);

    return new Response(
      JSON.stringify({ response: data.content }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error connecting to FastAPI backend'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});