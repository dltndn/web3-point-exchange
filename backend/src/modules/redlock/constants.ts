export const HANDLE_POINT_LOCK = (userId: string) =>
  `handle_point_lock:${userId}`;

export const HANDLE_POINT_LOCK_EXPIRE_TIME = 1000 * 10; // 10 seconds

export const HANDLE_POINT_SWAP_TRANSACTION_LOCK =
  'handle_point_swap_transaction_lock';
