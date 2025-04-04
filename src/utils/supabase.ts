import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdqrmxmqsoxncnkxiqwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcXJteG1xc294bmNua3hpcXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NTM2MzgsImV4cCI6MjA1OTMyOTYzOH0.2-66_0X62mcPTybkc4BmGpV6nbzgMTRM90cPy0lnJRg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 