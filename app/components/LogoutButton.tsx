"use client";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "6px 14px",
        color: "var(--muted)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      로그아웃
    </button>
  );
}
