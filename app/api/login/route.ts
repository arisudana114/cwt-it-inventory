import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  console.log("LOGIN DEBUG", {
    username,
    password,
    ENV_USERNAME: process.env.ADMIN_USERNAME,
    ENV_PASSWORD: process.env.ADMIN_PASSWORD,
  });
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", username, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return res;
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
