"use client";

import styles from "./VocabularyScreen.module.css";

interface HearButtonsProps {
  canSpeakEnglish: boolean;
  canSpeakRussian: boolean;
  onSpeakEnglish: () => void;
  onSpeakRussian: () => void;
}

export function HearButtons({
  canSpeakEnglish,
  canSpeakRussian,
  onSpeakEnglish,
  onSpeakRussian,
}: HearButtonsProps) {
  return (
    <div className={styles.listenGroup}>
      <button
        className={styles.listenButton}
        disabled={!canSpeakEnglish}
        onClick={onSpeakEnglish}
        type="button"
      >
        EN
      </button>
      <button
        className={styles.listenButton}
        disabled={!canSpeakRussian}
        onClick={onSpeakRussian}
        type="button"
      >
        RU
      </button>
    </div>
  );
}
