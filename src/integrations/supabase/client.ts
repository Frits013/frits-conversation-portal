// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://eqjsrvbisiuysboukgnt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxanNydmJpc2l1eXNib3VrZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTIxNjksImV4cCI6MjA1MjUyODE2OX0.3-X4drFoPFwj7mn_4mvcD-in_HHikrPXcOV_7FZb1Us";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);