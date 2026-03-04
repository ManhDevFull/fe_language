export interface EnrichmentResult {
  input: string;
  englishWord: string;
  englishPhonetic: string;
  russianWord: string;
  russianPhonetic: string;
  partOfSpeech: string;
  meaning: string;
}

export interface EnrichApiResponse {
  data: EnrichmentResult;
  meta: {
    cached: boolean;
  };
}

export type RowStatus = "idle" | "loading" | "ready" | "error";

export interface VocabularySheetRow {
  id: string;
  input: string;
  englishWord: string;
  englishPhonetic: string;
  russianWord: string;
  russianPhonetic: string;
  partOfSpeech: string;
  meaning: string;
  status: RowStatus;
  errorMessage: string;
  lastResolvedInput: string;
}

export interface PersistedVocabularySheetRow {
  id: string;
  input: string;
  englishWord: string;
  englishPhonetic: string;
  russianWord: string;
  russianPhonetic: string;
  partOfSpeech: string;
  meaning: string;
  lastResolvedInput: string;
}
