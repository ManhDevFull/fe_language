# Langues Frontend

Frontend học từ vựng được xây dựng bằng Next.js App Router, mobile-first, và hỗ trợ PWA.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Các module chính

- `src/components/vocabulary/VocabularyScreen.tsx`: màn hình sheet kiểu Excel.
- `src/components/vocabulary/VocabularyTable.tsx`: bảng nhập cột 2, auto-fill các cột sau.
- `src/hooks/useVocabularySheet.ts`: quản lý dữ liệu sheet + lưu localStorage cho PWA.
- `src/app/api/v1/vocabularies/enrich/route.ts`: proxy từ Next server sang Go backend.
- `src/hooks/useSpeechSynthesis.ts`: phát âm EN/RU bằng Web Speech API.

## Biến môi trường

```bash
BACKEND_INTERNAL_URL=http://127.0.0.1:8080
```
