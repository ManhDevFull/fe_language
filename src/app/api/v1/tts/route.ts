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
  const text = request.nextUrl.searchParams.get("text")?.trim() ?? "";
  const lang = request.nextUrl.searchParams.get("lang")?.trim() ?? "en-US";

  if (!text) {
    return NextResponse.json(
      { error: { message: "Text phát âm không được để trống." } },
      { status: 400 },
    );
  }

  const upstreamUrl = `${getBackendBaseUrl()}/api/v1/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
    });

    const arrayBuffer = await upstream.arrayBuffer();

    if (!upstream.ok) {
      const rawText = new TextDecoder().decode(arrayBuffer);

      try {
        const parsed = JSON.parse(rawText) as { error?: { message?: string } };
        return NextResponse.json(
          {
            error: {
              message:
                parsed.error?.message ?? "Không thể tạo âm thanh phát âm từ backend.",
            },
          },
          { status: upstream.status },
        );
      } catch {
        return NextResponse.json(
          {
            error: {
              message: "Không thể tạo âm thanh phát âm từ backend.",
            },
          },
          { status: upstream.status },
        );
      }
    }

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "Không thể kết nối backend để tạo âm thanh.",
        },
      },
      { status: 503 },
    );
  }
}
