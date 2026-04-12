export interface DailySummary {
  date: string;
  target_date: string;
  total_sold: number;
  total_capacity: number;
  sold_out_time?: string;
  peak_hour?: number;
  first_reading?: string;
  by_route: Record<string, number>;
}

export interface MonthHistory {
  month: string;
  days: DailySummary[];
}

export interface RouteStats {
  route: string;
  circuit: string;
  capacity: number;
  sold_out_count: number;
  avg_occupancy: number;
  avg_velocity: number;
  history: Array<{
    date: string;
    sold: number;
    sold_out_time?: string;
  }>;
}

export interface Patterns {
  by_hour: number[];
  by_weekday: number[];
  by_month: Record<string, number>;
}
