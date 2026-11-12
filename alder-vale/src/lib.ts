export const u = (p: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p}`;
export const money = (n: number) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
