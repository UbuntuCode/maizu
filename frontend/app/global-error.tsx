"use client";

/* ── Global Error Catcher ──────────────────────────────────────
   Temporary debugging tool: shows the REAL error message on
   screen instead of Next.js's generic "Application error" text.
   File location: frontend/app/global-error.tsx
─────────────────────────────────────────────────────────────── */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: 24,
          background: "#111",
          color: "#fff",
          fontFamily: "monospace",
          minHeight: "100vh",
        }}
      >
        <h2 style={{ color: "#ff6b6b" }}>⚠️ Maizu crashed — here&apos;s why:</h2>
        <p style={{ color: "#ffd93d", fontSize: 16, wordBreak: "break-word" }}>
          <strong>Message:</strong> {error.message || "(no message)"}
        </p>

        {error.digest && (
          <p style={{ color: "#aaa" }}>
            <strong>Digest:</strong> {error.digest}
          </p>
        )}

        <pre
          style={{
            background: "#1e1e1e",
            padding: 16,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            color: "#9ae66e",
          }}
        >
          {error.stack || "(no stack trace)"}
        </pre>

        <button
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#4dabf7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
