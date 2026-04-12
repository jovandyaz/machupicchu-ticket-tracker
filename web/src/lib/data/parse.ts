import { ReadingSchema, type Reading } from "@/lib/types/record";

/**
 * Parses a JSONL blob into an array of `Reading`s. Validates every line with
 * the Zod schema and throws a `line N: …` error on the first malformed or
 * schema-mismatched line.
 */
export function parseJsonl(raw: string): Reading[] {
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, idx) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch (err) {
        throw new Error(
          `Invalid JSON at line ${idx + 1}: ${(err as Error).message}`,
        );
      }
      const result = ReadingSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(
          `Schema mismatch at line ${idx + 1}: ${result.error.message}`,
        );
      }
      return result.data;
    });
}
