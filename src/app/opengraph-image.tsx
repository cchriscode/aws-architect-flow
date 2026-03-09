import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ArchFlow — AWS Architecture Design Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const features = [
  { icon: "🏗️", title: "14-Step Wizard" },
  { icon: "💰", title: "Cost Estimation" },
  { icon: "🏆", title: "WAFR Scoring" },
  { icon: "📐", title: "Terraform Code" },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-1px",
            }}
          >
            ArchFlow
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "24px",
            color: "#c7d2fe",
            marginBottom: "48px",
            textAlign: "center",
          }}
        >
          AWS Architecture Design Guide
        </div>

        {/* Feature badges */}
        <div style={{ display: "flex", gap: "20px" }}>
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "18px",
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              <span>{f.icon}</span>
              <span>{f.title}</span>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "16px",
            color: "#a5b4fc",
          }}
        >
          archflow-aws.online
        </div>
      </div>
    ),
    { ...size }
  );
}
