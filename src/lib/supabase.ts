import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cyygrtannnvchyqhffrh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eWdydGFubm52Y2h5cWhmZnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMDE3ODUsImV4cCI6MjEwMjg3Nzc4NX0.gfKLJFXlJYoLCiOgc_tNzhokg545FNpPhGSvIQnSa-w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
