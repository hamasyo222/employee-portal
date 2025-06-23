import { fetcher } from '../utils';
import { ApiResponse } from '../types';

export async function getUser(userId: string) {
  return fetcher<ApiResponse<any>>(`/api/users/${userId}`);
} 