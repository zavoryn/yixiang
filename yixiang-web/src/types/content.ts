export type ContentType = 'POST' | 'DRAFT';

export interface ContentStatus {
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'DELETED';
  updatedAt: string;
}
