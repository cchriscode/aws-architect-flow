import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { estimateMonthlyCost } from "@/lib/cost";
import { wellArchitectedScore } from "@/lib/wafr";
import { generateSummary } from "@/lib/summary";
import { generateArchitecture } from "@/lib/architecture";
import type { WizardState } from "@/lib/types";

function generateShortId(): string {
  return crypto.randomBytes(6).toString("base64url");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { state, completedPhases } = body as {
    state: WizardState;
    completedPhases: string[];
  };

  if (!state || !completedPhases) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const lang = "ko" as const;
  const cost = estimateMonthlyCost(state, lang);
  const wafr = wellArchitectedScore(state, lang);
  const arch = generateArchitecture(state, lang);
  const summary = generateSummary(state, { cost, wafr, arch }, lang);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  // Retry up to 3 times for shortId collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const shortId = generateShortId();
    try {
      await prisma.share.create({
        data: {
          shortId,
          state: state as object,
          completedPhases,
          headline: summary.headline,
          monthlyCost: cost.totalMid,
          wafrScore: wafr.overall,
          serviceCount: arch.layers.reduce((sum, l) => sum + l.services.length, 0),
          expiresAt,
        },
      });
      return NextResponse.json({ shortId }, { status: 201 });
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === "P2002" && attempt < 2) continue;
      throw e;
    }
  }

  return NextResponse.json({ error: "Failed to generate unique ID" }, { status: 500 });
}
