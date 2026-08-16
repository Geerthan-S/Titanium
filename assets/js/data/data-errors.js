export class DataError extends Error {
  constructor(message, { code = 'DATA_ERROR', retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = 'DataError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function throwIfError(error, fallback = 'The data request failed.') {
  if (!error) return;
  const technicalMessage = String(error.message || '');
  const isConfigurationError = /invalid api key|invalid jwt|failed to fetch|networkerror/i.test(technicalMessage);
  throw new DataError(isConfigurationError ? fallback : (technicalMessage || fallback), {
    code: error.code || 'SUPABASE_ERROR',
    retryable: ['PGRST000', 'PGRST001', 'PGRST002'].includes(error.code),
    cause: error,
  });
}
