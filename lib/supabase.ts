import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lfqgkezyjjxsxparanpe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcWdrZXp5amp4c3hwYXJhbnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTIxMTMsImV4cCI6MjA5MDQ4ODExM30.uUfeka9vNGelet3RPWKOpUH-nH4T4jY-GYewd7PdcfI";

export const supabase = createClient(supabaseUrl, supabaseKey);
