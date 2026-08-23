export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SingleResponse<T> {
  data: T;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  message: string;
  field?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | string[];
  };
}

