import { createClient } from "@supabase/supabase-js";

// Deliberately not NEXT_PUBLIC_: Next inlines those at build time, even in
// server code, so one added to Vercel after a build stays undefined until the
// next one. This is read at runtime and never reaches the browser.
// NEXT_PUBLIC_SUPABASE_URL is still honoured so an older setup keeps working.
function supabaseUrl() {
  return (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}

/** Everything wrong with the Supabase config, or null if it's usable. */
export function configProblem(): string | null {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const problems: string[] = [];

  if (!url) {
    problems.push("SUPABASE_URL is not set");
  } else if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) {
    // The dashboard link and the API URL are easy to mix up, and pasting the
    // dashboard one fails confusingly: requests get HTML back instead of JSON.
    problems.push(
      "SUPABASE_URL should look like https://<ref>.supabase.co — copy the Project URL from Settings → API, not the dashboard address bar",
    );
  }

  if (!key) problems.push("SUPABASE_SERVICE_ROLE_KEY is not set");

  return problems.length ? problems.join("; ") : null;
}

// Server-only client. The service_role key bypasses RLS, so this module must
// never be imported from a component that ships to the browser.
export function serverClient() {
  const problem = configProblem();
  if (problem) throw new Error(problem);

  return createClient(supabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
