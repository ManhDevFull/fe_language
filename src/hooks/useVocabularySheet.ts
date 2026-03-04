"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { enrichVocabulary } from "@/lib/api";
import {
  PersistedVocabularySheetRow,
  VocabularySheetRow,
} from "@/types/vocabulary";

const STORAGE_KEY = "langues.vocabulary.sheet.v1";

const createRowId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createEmptyRow = (): VocabularySheetRow => ({
  id: createRowId(),
  input: "",
  englishWord: "",
  englishPhonetic: "",
  russianWord: "",
  russianPhonetic: "",
  partOfSpeech: "",
  meaning: "",
  status: "idle",
  errorMessage: "",
  lastResolvedInput: "",
});

const rowHasValue = (row: VocabularySheetRow) =>
  row.input.trim() !== "" ||
  row.lastResolvedInput.trim() !== "" ||
  row.meaning.trim() !== "";

const ensureTrailingEmptyRow = (rows: VocabularySheetRow[]) => {
  if (rows.length === 0) {
    return [createEmptyRow()];
  }

  const lastRow = rows[rows.length - 1];
  if (lastRow.input.trim() === "") {
    return rows;
  }

  return [...rows, createEmptyRow()];
};

const toPersistedRows = (
  rows: VocabularySheetRow[],
): PersistedVocabularySheetRow[] => {
  return rows
    .filter((row) => rowHasValue(row))
    .map((row) => ({
      id: row.id,
      input: row.input,
      englishWord: row.englishWord,
      englishPhonetic: row.englishPhonetic,
      russianWord: row.russianWord,
      russianPhonetic: row.russianPhonetic,
      partOfSpeech: row.partOfSpeech,
      meaning: row.meaning,
      lastResolvedInput: row.lastResolvedInput,
    }));
};

const fromPersistedRows = (raw: string): VocabularySheetRow[] => {
  const decoded = JSON.parse(raw) as PersistedVocabularySheetRow[];
  if (!Array.isArray(decoded)) {
    return [createEmptyRow()];
  }

  const rows = decoded
    .map((row) => ({
      id: typeof row.id === "string" && row.id.trim() ? row.id : createRowId(),
      input: typeof row.input === "string" ? row.input : "",
      englishWord: typeof row.englishWord === "string" ? row.englishWord : "",
      englishPhonetic:
        typeof row.englishPhonetic === "string" ? row.englishPhonetic : "",
      russianWord: typeof row.russianWord === "string" ? row.russianWord : "",
      russianPhonetic:
        typeof row.russianPhonetic === "string" ? row.russianPhonetic : "",
      partOfSpeech:
        typeof row.partOfSpeech === "string" ? row.partOfSpeech : "",
      meaning: typeof row.meaning === "string" ? row.meaning : "",
      status: "idle" as const,
      errorMessage: "",
      lastResolvedInput:
        typeof row.lastResolvedInput === "string" ? row.lastResolvedInput : "",
    }))
    .filter((row) => rowHasValue(row));

  if (rows.length === 0) {
    return [createEmptyRow()];
  }

  return ensureTrailingEmptyRow(rows);
};

export function useVocabularySheet() {
  const [rows, setRows] = useState<VocabularySheetRow[]>([createEmptyRow()]);
  const [hydrated, setHydrated] = useState(false);
  const rowsRef = useRef(rows);
  const controllersRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }

    try {
      setRows(fromPersistedRows(raw));
    } catch {
      setRows([createEmptyRow()]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(toPersistedRows(rows)),
    );
  }, [hydrated, rows]);

  useEffect(() => {
    return () => {
      Object.values(controllersRef.current).forEach((controller) => {
        controller.abort();
      });
    };
  }, []);

  const updateInput = useCallback((rowId: string, value: string) => {
    setRows((current) => {
      const nextRows = current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const normalizedInput = value.trim().toLowerCase();
        const normalizedResolved = row.lastResolvedInput.trim().toLowerCase();
        const shouldResetAutoFill =
          normalizedInput === "" ||
          (normalizedResolved !== "" && normalizedResolved !== normalizedInput);

        if (shouldResetAutoFill) {
          return {
            ...row,
            input: value,
            englishWord: "",
            englishPhonetic: "",
            russianWord: "",
            russianPhonetic: "",
            partOfSpeech: "",
            meaning: "",
            status: "idle" as const,
            errorMessage: "",
            lastResolvedInput: "",
          };
        }

        return {
          ...row,
          input: value,
          status: row.status === "error" ? ("idle" as const) : row.status,
          errorMessage: "",
        };
      });

      return ensureTrailingEmptyRow(nextRows);
    });
  }, []);

  const enrichRow = useCallback(async (rowId: string) => {
    const currentRow = rowsRef.current.find((row) => row.id === rowId);
    if (!currentRow) {
      return;
    }

    const cleanInput = currentRow.input.trim();
    if (!cleanInput) {
      return;
    }

    const normalizedInput = cleanInput.toLowerCase();
    if (currentRow.lastResolvedInput.toLowerCase() === normalizedInput) {
      return;
    }

    controllersRef.current[rowId]?.abort();

    const controller = new AbortController();
    controllersRef.current[rowId] = controller;

    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              status: "loading",
              errorMessage: "",
            }
          : row,
      ),
    );

    try {
      const payload = await enrichVocabulary(cleanInput, controller.signal);

      setRows((current) => {
        const nextRows = current.map((row) => {
          if (row.id !== rowId) {
            return row;
          }

          if (row.input.trim().toLowerCase() !== normalizedInput) {
            return row;
          }

          return {
            ...row,
            englishWord: payload.data.englishWord || cleanInput,
            englishPhonetic: payload.data.englishPhonetic,
            russianWord: payload.data.russianWord,
            russianPhonetic: payload.data.russianPhonetic,
            partOfSpeech: payload.data.partOfSpeech,
            meaning: payload.data.meaning,
            status: "ready" as const,
            errorMessage: "",
            lastResolvedInput: normalizedInput,
          };
        });

        return ensureTrailingEmptyRow(nextRows);
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Xử lý cột nhập thất bại.";

      setRows((current) =>
        current.map((row) =>
          row.id === rowId
            ? {
                ...row,
                status: "error",
                errorMessage: message,
              }
            : row,
        ),
      );
    } finally {
      if (controllersRef.current[rowId] === controller) {
        delete controllersRef.current[rowId];
      }
    }
  }, []);

  const resetSheet = useCallback(() => {
    Object.values(controllersRef.current).forEach((controller) => {
      controller.abort();
    });

    controllersRef.current = {};
    setRows([createEmptyRow()]);
  }, []);

  const completedRows = useMemo(
    () => rows.filter((row) => row.lastResolvedInput !== "").length,
    [rows],
  );

  return {
    rows,
    hydrated,
    completedRows,
    updateInput,
    enrichRow,
    resetSheet,
  };
}
