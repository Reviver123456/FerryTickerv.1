import type { NextRequest } from "next/server";

const DEFAULT_UPSTREAM_API_BASE_URL = "https://api-ferryticket.onrender.com";

const UPSTREAM_API_BASE_URL = (
  process.env.FERRY_API_BASE_URL ??
  process.env.NEXT_PUBLIC_FERRY_API_BASE_URL ??
  DEFAULT_UPSTREAM_API_BASE_URL
).replace(/\/+$/, "");

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: {
    path: string[];
  };
};

function buildUpstreamUrl(request: NextRequest, pathSegments: string[]) {
  const targetUrl = new URL(`${UPSTREAM_API_BASE_URL}/api/${pathSegments.join("/")}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

function buildUpstreamHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  ["host", "origin", "referer", "connection", "content-length"].forEach((headerName) => {
    headers.delete(headerName);
  });

  headers.set("accept", headers.get("accept") ?? "application/json");

  return headers;
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  try {
    const targetUrl = buildUpstreamUrl(request, context.params.path);
    const method = request.method;
    const headers = buildUpstreamHeaders(request);
    const body =
      method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);

    responseHeaders.delete("content-length");
    responseHeaders.delete("content-encoding");
    responseHeaders.set("x-proxied-by", "ferry-ticket-next");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Unable to reach upstream API",
      },
      {
        status: 502,
      },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
