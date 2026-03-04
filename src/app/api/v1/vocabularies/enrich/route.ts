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

export async function POST(request: NextRequest) {
  let payload: { input?: string };

  try {
    payload = (await request.json()) as { input?: string };
  } catch {
    return NextResponse.json(
      { error: { message: "Payload không hợp lệ." } },
      { status: 400 },
    );
  }

  const input = payload.input?.trim() ?? "";
  if (!input) {
    return NextResponse.json(
      { error: { message: "Cột nhập không được để trống." } },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${getBackendBaseUrl()}/api/v1/vocabularies/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ input }),
    });

    const rawBody = await upstream.text();
    let parsedBody: unknown = null;

    if (rawBody.trim() !== "") {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
      } catch {
        if (!upstream.ok) {
          const fallbackMessage =
            upstream.status === 404
              ? "Backend chưa hỗ trợ endpoint /api/v1/vocabularies/enrich. Hãy khởi động lại server Go mới nhất."
              : `Backend trả lỗi ${upstream.status}: ${rawBody.trim()}`;

          return NextResponse.json(
            { error: { message: fallbackMessage } },
            {
              status: upstream.status,
              headers: { "Cache-Control": "no-store" },
            },
          );
        }

        return NextResponse.json(
          { error: { message: "Backend trả dữ liệu không phải JSON hợp lệ." } },
          {
            status: 502,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }
    }

    if (!upstream.ok) {
      const upstreamError =
        typeof parsedBody === "object" &&
        parsedBody !== null &&
        "error" in parsedBody &&
        typeof parsedBody.error === "object" &&
        parsedBody.error !== null &&
        "message" in parsedBody.error &&
        typeof parsedBody.error.message === "string"
          ? parsedBody.error.message
          : `Xử lý từ vựng thất bại với mã ${upstream.status}.`;

      return NextResponse.json(
        { error: { message: upstreamError } },
        {
          status: upstream.status,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(parsedBody ?? {}, {
      status: upstream.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          message:
            "Không thể kết nối backend. Hãy kiểm tra server Go đang chạy cổng 8080.",
        },
      },
      { status: 503 },
    );
  }
}
