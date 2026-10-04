import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Service role client - full DB access, used for admin ops & bypassing RLS when needed
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Creates a client scoped to the requesting user's JWT (respects RLS)
export function supabaseForUser(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}