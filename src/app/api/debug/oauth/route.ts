import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export async function GET(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const data = {
    ok: true,
    nextauth_url_present: !!process.env.NEXTAUTH_URL,
    google_client_id_present: !!process.env.GOOGLE_CLIENT_ID,
    google_client_secret_present: !!process.env.GOOGLE_CLIENT_SECRET,
  };
  return withCors(req, NextResponse.json(data, { status: 200 }));
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}


