/**
 * Solis - Common Domain Types
 */

export type ID = string;

export type ISODateString = string;

export interface BaseEntity {
  id: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type StatusType = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export interface DateRange {
  startDate: ISODateString;
  endDate: ISODateString;
}

export type ThemeMode = 'light' | 'dark' | 'system';
