import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(request.url);
  url.pathname = `/api/studies/${id}/rate`;
  return NextResponse.redirect(url, 308);
}

