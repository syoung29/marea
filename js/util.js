// Utilidades de DOM, fechas y formato compartidas por toda la app
export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const r25 = x => Math.round(x / 2.5) * 2.5;
export const clone = o => JSON.parse(JSON.stringify(o));
export const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const lunes = d => { d = new Date(d); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
export const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const fd = d => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
export const fmt = (v, u) => (Math.round(v * 10) / 10).toLocaleString('es') + (u ? ' ' + u : '');
let n = 0;
export const nid = p => p + Date.now().toString(36) + (n++).toString(36);
