import { NextResponse } from "next/server";

export function GET(request: Request) {
  try {
    return NextResponse.redirect(new URL('/attendance', request.url));
  } catch (e) {
    return NextResponse.redirect('/attendance');
  }
}
