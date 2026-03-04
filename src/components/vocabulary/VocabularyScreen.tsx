"use client";

import { usePronunciation } from "@/hooks/usePronunciation";
import { useVocabularySheet } from "@/hooks/useVocabularySheet";

import { VocabularyTable } from "./VocabularyTable";
import styles from "./VocabularyScreen.module.css";

export function VocabularyScreen() {
  const { rows, updateInput, enrichRow } = useVocabularySheet();
  const pronunciation = usePronunciation();

  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <VocabularyTable
          onCommitRow={enrichRow}
          onInputChange={updateInput}
          onSpeakEnglish={(word) => {
            void pronunciation.speak(word, "en-US");
          }}
          onSpeakRussian={(word) => {
            void pronunciation.speak(word, "ru-RU");
          }}
          rows={rows}
        />
      </section>
    </main>
  );
}
