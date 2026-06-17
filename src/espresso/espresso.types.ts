export type EspressoRawEntrySource = 'manual' | 'import';

export interface EspressoRawEntryRecord {
  id: string;
  beanName: string;
  source: EspressoRawEntrySource;
  capturedAt: string;
  text: string;
  normalizedBeanId?: string | null;
  normalizedLogId?: string | null;
  normalizedRoundId?: string | null;
}

export interface EspressoNormalizedData {
  schemaVersion: 1;
  beans: Record<string, unknown>[];
}

export interface EspressoRawData {
  schemaVersion: 1;
  entries: EspressoRawEntryRecord[];
}
