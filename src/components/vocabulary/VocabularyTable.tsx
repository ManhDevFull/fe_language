"use client";

import { KeyboardEvent, useEffect, useRef } from "react";

import { VocabularySheetRow } from "@/types/vocabulary";

import { HearButtons } from "./HearButtons";
import styles from "./VocabularyScreen.module.css";

interface VocabularyTableProps {
  rows: VocabularySheetRow[];
  onInputChange: (rowId: string, value: string) => void;
  onCommitRow: (rowId: string) => void;
  onSpeakEnglish: (word: string) => void;
  onSpeakRussian: (word: string) => void;
}

const AUTO_COMMIT_DELAY = 650;

export function VocabularyTable({
  rows,
  onInputChange,
  onCommitRow,
  onSpeakEnglish,
  onSpeakRussian,
}: VocabularyTableProps) {
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const scheduleAutoCommit = (rowId: string) => {
    if (timersRef.current[rowId]) {
      window.clearTimeout(timersRef.current[rowId]);
    }

    timersRef.current[rowId] = window.setTimeout(() => {
      onCommitRow(rowId);
      delete timersRef.current[rowId];
    }, AUTO_COMMIT_DELAY);
  };

  const flushCommit = (rowId: string) => {
    if (timersRef.current[rowId]) {
      window.clearTimeout(timersRef.current[rowId]);
      delete timersRef.current[rowId];
    }

    onCommitRow(rowId);
  };

  const handleEnter = (event: KeyboardEvent<HTMLInputElement>, rowId: string) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    flushCommit(rowId);
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Nhập</th>
            <th>Phiên âm (Anh)</th>
            <th>Phiên âm (Nga)</th>
            <th>Từ loại</th>
            <th>Nghĩa (Việt)</th>
            <th>Nghe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const englishToSpeak = row.englishWord || row.input.trim();
            const russianToSpeak = row.russianWord.trim();

            return (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td>
                  <input
                    className={`${styles.wordInput} ${
                      row.status === "error" ? styles.inputError : ""
                    }`}
                    disabled={row.status === "loading"}
                    onBlur={() => {
                      flushCommit(row.id);
                    }}
                    onChange={(event) => {
                      onInputChange(row.id, event.target.value);
                      scheduleAutoCommit(row.id);
                    }}
                    onKeyDown={(event) => {
                      handleEnter(event, row.id);
                    }}
                    placeholder="Nhập từ tiếng Anh..."
                    value={row.input}
                  />
                </td>
                <td className={styles.mutedCell}>{row.englishPhonetic || "—"}</td>
                <td className={styles.mutedCell}>{row.russianPhonetic || "—"}</td>
                <td className={styles.mutedCell}>{row.partOfSpeech || "—"}</td>
                <td>{row.meaning || "—"}</td>
                <td>
                  <HearButtons
                    canSpeakEnglish={englishToSpeak !== ""}
                    canSpeakRussian={russianToSpeak !== ""}
                    onSpeakEnglish={() => {
                      onSpeakEnglish(englishToSpeak);
                    }}
                    onSpeakRussian={() => {
                      onSpeakRussian(russianToSpeak);
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
