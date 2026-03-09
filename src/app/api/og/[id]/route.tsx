import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const share = await prisma.share.findUnique({ where: { shortId: id } });

  if (!share || share.expiresAt < new Date()) {
    return new Response("Not found", { status: 404 });
  }

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
        {/* ArchFlow branding */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#c7d2fe",
            marginBottom: "16px",
          }}
        >
          ArchFlow
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "40px",
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: "40px",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.3,
          }}
        >
          {share.headline}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "20px 36px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#c7d2fe", marginBottom: "4px" }}>
              Monthly Cost
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff" }}>
              ${share.monthlyCost.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "20px 36px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#c7d2fe", marginBottom: "4px" }}>
              WAFR Score
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff" }}>
              {share.wafrScore}pts
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "20px 36px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#c7d2fe", marginBottom: "4px" }}>
              Services
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff" }}>
              {share.serviceCount}
            </div>
          </div>
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
    { width: 1200, height: 630 }
  );
}
