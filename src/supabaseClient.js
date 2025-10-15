// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// Correct way to access environment variables in a Vite project:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create the client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)