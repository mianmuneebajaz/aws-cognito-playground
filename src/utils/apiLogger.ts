import { ApiLog } from '../types';

let logs: ApiLog[] = [];
let logListeners: ((logs: ApiLog[]) => void)[] = [];

export const addApiLog = (log: Omit<ApiLog, 'id' | 'timestamp'>) => {
  const newLog: ApiLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  
  logs = [newLog, ...logs].slice(0, 100); // Keep only last 100 logs
  logListeners.forEach(listener => listener(logs));
};

export const getApiLogs = () => logs;

export const clearApiLogs = () => {
  logs = [];
  logListeners.forEach(listener => listener(logs));
};

export const subscribeToLogs = (callback: (logs: ApiLog[]) => void) => {
  logListeners.push(callback);
  return () => {
    logListeners = logListeners.filter(listener => listener !== callback);
  };
};

// Utility to wrap Auth methods with logging
export const withLogging = async <T>(
  action: string,
  request: any,
  authMethod: () => Promise<T>
): Promise<T> => {
  const sanitizedRequest = { ...request };
  if (sanitizedRequest.password) {
    sanitizedRequest.password = '[REDACTED]';
  }
  
  try {
    const response = await authMethod();
    addApiLog({
      action,
      request: sanitizedRequest,
      response,
      status: 'success'
    });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addApiLog({
      action,
      request: sanitizedRequest,
      response: null,
      status: 'error',
      error: errorMessage
    });
    throw error;
  }
};