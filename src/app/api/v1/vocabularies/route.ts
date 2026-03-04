import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8080";

const getBackendBaseUrl = () => {
  const configured =
    process.env.BACKEND_INTERNAL_URL ??
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_URL;

  return configured.replace(/\/+$/, "");
};

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  const url = `${getBackendBaseUrl()}/api/v1/vocabularies${search}`;

  try {
    const upstream = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          message:
            "Khong the ket noi backend. Hay kiem tra server Go dang chay tai cong 8080.",
        },
      },
      { status: 503 },
    );
  }
}
