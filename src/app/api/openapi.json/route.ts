import { NextRequest, NextResponse } from "next/server";
import { openapiSpec } from "@/api-spec/openapi";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export async function GET(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const res = NextResponse.json(openapiSpec, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
  return withCors(req, res);
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}


