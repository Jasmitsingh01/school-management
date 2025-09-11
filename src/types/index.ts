
export interface User {
  id: number;
  userId: number;
  name: string;
  email: string;
  email_verified: boolean;
}

export interface School {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  contact?: string;
  image: string;
  email_id?: string;
  created_by?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface SchoolsResponse {
  schools: School[];
  cities?: string[];
  pagination?: PaginationInfo;
}

export interface SchoolResponse {
  school: School;
}

export interface UploadResponse {
  message: string;
  filePath: string;
  success: boolean;
  error?: string;
}

export interface FormValues {
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  email_id: string;
  image: string;
}