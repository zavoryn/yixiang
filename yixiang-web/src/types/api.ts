export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageRequest {
  cursor?: string;
  limit?: number;
}
