import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ProfileIndexPage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  redirect(`/profile/${session.userId}`);
}
