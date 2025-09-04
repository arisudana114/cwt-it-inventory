import { cookies } from "next/headers";

export async function isAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === process.env.USERNAME;
}
