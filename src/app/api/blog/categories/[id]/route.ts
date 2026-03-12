import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Admin: delete category
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Posts with this category will have categoryId set to null (onDelete: SetNull)
  await prisma.blogCategory.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
