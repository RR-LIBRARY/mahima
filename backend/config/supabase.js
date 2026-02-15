import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Ab ye sirf Environment Variables se value lega
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check karein ki values hain ya nahi (Debugging ke liye)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Supabase URL or Anon Key is missing in Environment Variables!");
}

// Client create karein
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

export default supabase;