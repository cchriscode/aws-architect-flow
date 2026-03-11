import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name } = body as { name?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  // Atomic ownership check + update
  const { count } = await prisma.historyEntry.updateMany({
    where: { id, userId: session.user.id },
    data: { name: name.trim() },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const entry = await prisma.historyEntry.findUnique({ where: { id } });
  return NextResponse.json(entry);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Atomic ownership check + delete
  const { count } = await prisma.historyEntry.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
