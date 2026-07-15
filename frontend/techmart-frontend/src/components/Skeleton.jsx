import { useEffect, useState } from "react";

// Base skeleton block
export function SkeletonBlock({ width = "100%", height = "16px", borderRadius = "6px", style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: "var(--skeleton-base, #2a2a2a)",
      backgroundImage: "linear-gradient(90deg, var(--skeleton-base, #2a2a2a) 0%, var(--skeleton-shine, #3a3a3a) 50%, var(--skeleton-base, #2a2a2a) 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      flexShrink: 0,
      ...style
    }} />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden" }}>
      <SkeletonBlock height="160px" borderRadius="0" />
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonBlock width="40%" height="10px" />
        <SkeletonBlock width="80%" height="13px" />
        <SkeletonBlock width="50%" height="14px" />
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        :root {
          --skeleton-base: #2a2a2a;
          --skeleton-shine: #3a3a3a;
        }
        [data-theme="light"] {
          --skeleton-base: #e5e7eb;
          --skeleton-shine: #f3f4f6;
        }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }} className="tm-grid">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

// Order card skeleton
export function OrderCardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <SkeletonBlock width="40%" height="12px" />
            <SkeletonBlock width="20%" height="20px" borderRadius="999px" />
          </div>
          <SkeletonBlock width="30%" height="15px" />
          <SkeletonBlock width="50%" height="12px" />
        </div>
      ))}
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonBlock width="25%" height="11px" />
          <SkeletonBlock width="60%" height="15px" />
        </div>
      ))}
    </div>
  );
}

// Transaction skeleton
export function TransactionSkeleton({ count = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <SkeletonBlock width="160px" height="13px" />
            <SkeletonBlock width="80px" height="11px" />
          </div>
          <SkeletonBlock width="70px" height="15px" />
        </div>
      ))}
    </div>
  );
}

// Product detail skeleton
export function ProductDetailSkeleton() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        <SkeletonBlock height="400px" borderRadius="12px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SkeletonBlock width="30%" height="12px" />
          <SkeletonBlock width="80%" height="24px" />
          <SkeletonBlock width="40%" height="28px" />
          <SkeletonBlock height="80px" borderRadius="10px" />
          <SkeletonBlock height="48px" borderRadius="10px" />
          <SkeletonBlock height="48px" borderRadius="10px" />
        </div>
      </div>
    </div>
  );
}
