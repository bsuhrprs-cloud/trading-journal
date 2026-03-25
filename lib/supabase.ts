import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export interface Position {
  id: string;
  ticker: string;
  trade_style: "daytrading" | "swing";
  open_date: string;
  close_date: string | null;
  avg_buy_price: number;
  avg_sell_price: number | null;
  total_quantity: number;
  profit_loss: number | null;
  reason: string | null;
  emotion: string | null;
  improvement: string | null;
  image_url: string | null;
  created_at: string;
}
