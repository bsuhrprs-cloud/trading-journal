import { createClient } from "../../lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface Position {
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

async function getPosition(id: string): Promise<Position | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("positions")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value)) + "원";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        gap: 12,
      }}
    >
      <span style={{ color: "var(--muted)", fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default async function DetailPage({
  params,
}: {
  params: { id: string };
}) {
  const position = await getPosition(params.id);
  if (!position) notFound();

  const plColor =
    position.profit_loss == null
      ? "var(--text)"
      : position.profit_loss >= 0
      ? "var(--red)"
      : "var(--blue)";

  const plText =
    position.profit_loss == null
      ? "-"
      : `${position.profit_loss >= 0 ? "+" : ""}${formatKRW(position.profit_loss)}`;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      {/* 뒤로가기 */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--muted)",
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        ← 목록으로
      </Link>

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 36 }}>{position.emotion ?? "😐"}</span>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>{position.ticker}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            {position.open_date}
            {position.close_date && position.close_date !== position.open_date
              ? ` ~ ${position.close_date}`
              : ""}
            &ensp;·&ensp;
            {position.trade_style === "daytrading" ? "데이트레이딩" : "스윙"}
          </p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: plColor }}>{plText}</div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>
            {position.total_quantity.toLocaleString()}주
          </div>
        </div>
      </div>

      {/* 차트 이미지 */}
      {position.image_url && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 24,
            border: "1px solid var(--border)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={position.image_url}
            alt={`${position.ticker} 차트`}
            style={{ width: "100%", display: "block", maxHeight: 480, objectFit: "contain" }}
          />
        </div>
      )}

      {/* 상세 데이터 */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "4px 20px 4px",
          marginBottom: 24,
        }}
      >
        <Row label="평균 매수가" value={formatKRW(position.avg_buy_price)} />
        <Row
          label="평균 매도가"
          value={position.avg_sell_price != null ? formatKRW(position.avg_sell_price) : "-"}
        />
        <Row label="총 수량" value={`${position.total_quantity.toLocaleString()}주`} />
        <Row
          label="손익금액"
          value={<span style={{ color: plColor, fontWeight: 700 }}>{plText}</span>}
        />
      </div>

      {/* 메모 */}
      {[
        { label: "매매 사유", value: position.reason },
        { label: "개선점", value: position.improvement },
      ].map(
        ({ label, value }) =>
          value && (
            <div
              key={label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 12,
              }}
            >
              <div
                style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8, fontWeight: 600 }}
              >
                {label}
              </div>
              <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{value}</p>
            </div>
          )
      )}
    </main>
  );
}
