import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

export default async function AdminBlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) {
    redirect("/login");
  }

  return <>{children}</>;
}
