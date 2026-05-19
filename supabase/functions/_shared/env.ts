/**
 * Environment variable validation for Deno-based Supabase Edge Functions.
 */

export function getEnv(name: string, defaultValue?: string): string {
  const value = Deno.env.get(name) || defaultValue;
  if (!value) {
    throw new Error(`CRITICAL: Environment variable "${name}" is missing. Function cannot proceed.`);
  }
  return value;
}

export function validateEnv(requiredKeys: string[]) {
  const missing = requiredKeys.filter(key => !Deno.env.get(key));
  if (missing.length > 0) {
    throw new Error(`CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
  }
}
