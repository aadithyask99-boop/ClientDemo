export const u = (p: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p}`;
export const money = (n: number) => `$${n.toLocaleString('en-US')}`;
