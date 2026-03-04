import { EnrichApiResponse } from "@/types/vocabulary";

const ENRICH_API_PATH = "/api/v1/vocabularies/enrich";

type ErrorPayload = {
  error?: {
    message?: string;
  };
};

const parseJsonSafe = (raw: string): unknown | null => {
  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

export async function enrichVocabulary(
  input: string,
  signal?: AbortSignal,
): Promise<EnrichApiResponse> {
  let response: Response;

  try {
    response = await fetch(ENRICH_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ input }),
      signal,
    });
  } catch {
    throw new Error("Không thể kết nối API. Kiểm tra frontend/backend đang chạy.");
  }

  const rawBody = await response.text();
  const parsedBody = parseJsonSafe(rawBody);

  if (!response.ok) {
    const errorMessage =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof (parsedBody as ErrorPayload).error?.message === "string"
        ? (parsedBody as ErrorPayload).error?.message
        : `Xử lý từ vựng thất bại (HTTP ${response.status}).`;

    throw new Error(errorMessage);
  }

  if (
    !parsedBody ||
    typeof parsedBody !== "object" ||
    !("data" in parsedBody) ||
    !("meta" in parsedBody)
  ) {
    throw new Error(
      "API trả dữ liệu không hợp lệ. Hãy kiểm tra backend đã chạy đúng phiên bản.",
    );
  }

  return parsedBody as EnrichApiResponse;
}
