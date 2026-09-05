import { createClient } from "@supabase/supabase-js";

/** Human-readable reason the Supabase config is unusable, or null if it's fine. */
export function configProblem(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) return "NEXT_PUBLIC_SUPABASE_URL is not set";
  if (!key) return "SUPABASE_SERVICE_ROLE_KEY is not set";

  // The dashboard link and the API URL are easy to mix up, and pasting the
  // dashboard one fails confusingly: requests get HTML back instead of JSON.
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url.trim())) {
    return "NEXT_PUBLIC_SUPABASE_URL should look like https://<ref>.supabase.co — copy the Project URL from Settings → API, not the dashboard address bar";
  }

  return null;
}

// Server-only client. The service_role key bypasses RLS, so this module must
// never be imported from a component that ships to the browser.
export function serverClient() {
  const problem = configProblem();
  if (problem) throw new Error(problem);

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
