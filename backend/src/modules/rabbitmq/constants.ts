/**
 * Service names for RabbitMQ
 */
export const POINT_SWAP_TRANSACTION_SERVICE = 'POINT_SWAP_TRANSACTION_SERVICE';
export const POINT_UPDATE_BALANCE_SERVICE = 'POINT_UPDATE_BALANCE_SERVICE';

/**
 * Queue names for RabbitMQ
 */
export const POINT_SWAP_TRANSACTION_QUEUE = 'point_swap_transaction_queue';
export const POINT_UPDATE_BALANCE_QUEUE = 'point_update_balance_queue';

export enum UpdateUserPointBalanceType {
  INCREASE = 1,
  DECREASE = 2,
}
