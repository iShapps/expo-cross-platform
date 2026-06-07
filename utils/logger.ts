const isDev = typeof global !== 'undefined' ? (global as any).__DEV__ : process.env.NODE_ENV !== 'production';

export function debug(...args: any[]) {
  if (isDev) console.debug(...args);
}

export function info(...args: any[]) {
  console.info(...args);
}

export function warn(...args: any[]) {
  console.warn(...args);
}

export function error(...args: any[]) {
  console.error(...args);
}
