import { supabase, Position } from "../lib/supabase";
import Link from "next/link";
import LogoutButton from "./components/LogoutButton";

export const revalidate = 60; // 1분마다 ISR 갱신

async function getPositions(): Promise<Position[]> {
  const { data } = await supabase
    .from("positions")
    .select("*")
    .order("open_date", { ascending: false })
    .limit(100);
  return data ?? [];
}

function getMonthlySummary(positions: Position[]) {
  const now = new Date();
  const thisMonth = positions.filter((p) => {
    const d = new Date(p.open_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const totalPL = thisMonth.reduce((sum, p) => sum + (p.profit_loss ?? 0), 0);
  const wins = thisMonth.filter((p) => (p.profit_loss ?? 0) > 0).length;
  const winRate = thisMonth.length > 0 ? Math.round((wins / thisMonth.length) * 100) : 0;
  return { count: thisMonth.length, totalPL, winRate };
}

function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(value)) + "원";
}

function PLBadge({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: "var(--muted)" }}>-</span>;
  const color = value >= 0 ? "var(--red)" : "var(--blue)";
  const sign = value >= 0 ? "+" : "";
  return <span style={{ color, fontWeight: 600 }}>{sign}{formatKRW(value)}</span>;
}

export default async function Home() {
  const positions = await getPositions();
  const { count, totalPL, winRate } = getMonthlySummary(positions);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>매매 복기 저널</h1>
        <LogoutButton />
      </div>
      <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
        {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })} 기준
      </p>

      {/* 이번달 요약 */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { label: "매매 횟수", value: `${count}회` },
          {
            label: "총 손익",
            value: (
              <PLBadge value={count > 0 ? totalPL : null} />
            ),
          },
          { label: "승률", value: count > 0 ? `${winRate}%` : "-" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "16px 20px",
            }}
          >
            <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </section>

      {/* 목록 */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>복기 목록</h2>
        {positions.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: 48 }}>
            아직 복기 기록이 없습니다.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {positions.map((p) => (
              <Link key={p.id} href={`/${p.id}`}>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")
                  }
                >
                  <div style={{ fontSize: 22 }}>{p.emotion ?? "😐"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{p.ticker}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                      {p.open_date}
                      {p.close_date && p.close_date !== p.open_date
                        ? ` ~ ${p.close_date}`
                        : ""}
                      &ensp;·&ensp;
                      {p.trade_style === "daytrading" ? "데이트레이딩" : "스윙"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <PLBadge value={p.profit_loss} />
                    <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                      {p.total_quantity.toLocaleString()}주
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
