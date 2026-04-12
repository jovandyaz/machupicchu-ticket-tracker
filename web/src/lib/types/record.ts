import { z } from "zod";

export const RouteReadingSchema = z.object({
  route: z.string(),
  circuit: z.string(),
  capacity: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  sold: z.number().int().nonnegative(),
});

export type RouteReading = z.infer<typeof RouteReadingSchema>;

export const ReadingSchema = z.object({
  timestamp: z.string(),
  date: z.string(),
  time: z.string(),
  target_date: z.string(),
  tickets_sold_today: z.number().int().nullable(),
  total_capacity: z.number().int(),
  total_sold: z.number().int(),
  total_available: z.number().int(),
  routes: z.array(RouteReadingSchema),
});

export type Reading = z.infer<typeof ReadingSchema>;
