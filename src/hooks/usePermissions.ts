import { User } from '../types';

export function usePermissions(user: User | null) {
  // 仮のロジック
  return {
    canView: !!user,
    canEdit: user?.userType === 'employee',
  };
} 