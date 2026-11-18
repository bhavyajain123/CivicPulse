
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address?: string;
  coordinates: Coordinates;
}

export type SortOrder = "asc" | "desc";

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}
