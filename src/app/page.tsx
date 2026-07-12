import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  // Not logged in → middleware already handles this, but belt-and-suspenders
  if (!session?.user) {
    redirect("/login");
  }

  // Logged in → will redirect to (dashboard)/page.tsx once Phase 2 is built.
  // For now, show a simple "auth works" confirmation.
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b2e 0%, #2d2845 40%, #714b67 100%)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: "1rem",
          padding: "2.5rem 3rem",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #714b67, #00a09d)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h15v13H1z" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>

        {/* Success indicator */}
        <div style={{ color: "#16a34a", marginBottom: "0.75rem" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto" }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem" }}>
          Authentication Working!
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
          Signed in as <strong>{session.user.email}</strong>
        </p>

        {/* Session info */}
        <div style={{ background: "#f8fafc", borderRadius: "0.625rem", padding: "1rem", textAlign: "left", fontSize: "0.8125rem", color: "#475569", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0", borderBottom: "1px solid #e2e8f0", marginBottom: "0.25rem" }}>
            <span style={{ color: "#94a3b8" }}>Name</span>
            <span style={{ fontWeight: 500 }}>{session.user.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0", borderBottom: "1px solid #e2e8f0", marginBottom: "0.25rem" }}>
            <span style={{ color: "#94a3b8" }}>Role</span>
            <span style={{ fontWeight: 500, color: "#714b67" }}>
              {(session.user as { role?: string }).role ?? "—"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
            <span style={{ color: "#94a3b8" }}>Session</span>
            <span style={{ fontWeight: 500, color: "#16a34a" }}>Active ✓</span>
          </div>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "1.25rem" }}>
          Dashboard UI coming in Phase 2 →
        </p>
      </div>
    </div>
  );
}
