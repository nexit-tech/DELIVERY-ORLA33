// lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

// Pega as chaves do ficheiro .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cria e exporta o cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey)