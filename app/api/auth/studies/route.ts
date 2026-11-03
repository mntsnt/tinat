import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/api/studies";
  return NextResponse.redirect(url, 308);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/api/studies";
  return NextResponse.redirect(url, 308);
}

