import { NextResponse } from "next/server";

/**
 * Parse JSON string fields on an object into actual arrays.
 * If a field is already an array or parsing fails, returns an empty array.
 */
export function parseJsonFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string") {
      try {
        result[field as keyof T] = JSON.parse(value) as T[keyof T];
      } catch {
        result[field as keyof T] = [] as unknown as T[keyof T];
      }
    }
  }
  return result;
}

/**
 * Stringify array fields on an object into JSON strings for SQLite storage.
 */
export function stringifyJsonFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    const value = result[field];
    if (Array.isArray(value)) {
      result[field as keyof T] = JSON.stringify(value) as unknown as T[keyof T];
    }
  }
  return result;
}

/**
 * Calculate skip and take values for Prisma pagination.
 */
export function paginate(page: number | string = 1, limit: number | string = 20) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
}

/**
 * Return a standardized error NextResponse.
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}
