import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  // 10 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  // check if the request is a server action and apply the rate limiting then
  if (typeof request.headers.get("Next-Action") === "string") {
    const ip = request.ip ?? "121.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new Response("Rate limited", { status: 429 });
    }
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
