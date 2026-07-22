import type { AnalysisRecord } from '../types';

const STORAGE_KEY = 'analysis_history';

export const saveRecord = async (record: AnalysisRecord) => {
  try {
    const existingRecords = await getRecords();
    existingRecords.unshift(record); // Add to the beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
  } catch (e) {
    console.error("Error saving record to localStorage: ", e);
  }
};

export const getRecords = async (): Promise<AnalysisRecord[]> => {
  try {
    const recordsStr = localStorage.getItem(STORAGE_KEY);
    if (recordsStr) {
      return JSON.parse(recordsStr) as AnalysisRecord[];
    }
  } catch (e) {
    console.error("Error fetching records from localStorage: ", e);
  }
  return [];
};
