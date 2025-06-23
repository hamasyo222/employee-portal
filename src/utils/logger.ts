export function logInfo(message: string) {
  // 本番では外部サービス連携も可
  console.info('[INFO]', message);
}

export function logError(message: string) {
  console.error('[ERROR]', message);
} 