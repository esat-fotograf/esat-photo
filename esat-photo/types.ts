export interface GenerationResult {
  imageUrl: string | null;
  error: string | null;
}

export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}