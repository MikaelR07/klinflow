import { z } from 'zod';

/**
 * ── PROFESSIONAL VALIDATION PIPELINE UTILITIES ─────────────────────────
 * Enforces strict runtime safety boundaries without cosmetic fallbacks.
 */

export function safeParseOrNull<T>(schema: z.ZodSchema<T>, data: any, context: string = 'Validation'): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[${context}] Validation Error:`, result.error.format());
    return null;
  }
  return result.data;
}

export function safeParseOrThrow<T>(schema: z.ZodSchema<T>, data: any, context: string = 'Validation'): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[${context}] Fatal Validation Error:`, result.error.format());
    throw new Error(`[${context}] Invalid payload.`);
  }
  return result.data;
}

export function safeParseArray<T>(schema: z.ZodSchema<T>, data: any[], context: string = 'Validation'): T[] {
  if (!Array.isArray(data)) {
    console.error(`[${context}] Expected array but got:`, typeof data);
    return [];
  }
  
  const validItems: T[] = [];
  for (const item of data) {
    const result = schema.safeParse(item);
    if (!result.success) {
      console.warn(`[${context}] Array Item Validation Failed:`, result.error.format(), item);
      continue;
    }
    validItems.push(result.data);
  }
  return validItems;
}

export function validateRealtimePayload<T>(schema: z.ZodSchema<T>, payload: any, context: string = 'Realtime'): T | null {
  return safeParseOrNull(schema, payload, context);
}
