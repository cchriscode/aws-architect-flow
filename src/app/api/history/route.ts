import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.historyEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { savedAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, state, completedPhases, summary } = body;

  if (!state || !completedPhases || !summary) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const entry = await prisma.historyEntry.create({
    data: {
      userId: session.user.id,
      name: name || summary.headline,
      state,
      completedPhases,
      headline: summary.headline,
      monthlyCost: summary.monthlyCost,
      wafrScore: summary.wafrScore,
      archPattern: summary.archPattern,
      workloadTypes: summary.workloadTypes,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.historyEntry.deleteMany({ where: { userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
