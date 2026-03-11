import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const share = await prisma.share.findUnique({ where: { shortId: id } });

  if (!share || share.expiresAt < new Date()) {
    return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
  }

  const { id: _id, ...publicShare } = share;
  return NextResponse.json(publicShare);
}
