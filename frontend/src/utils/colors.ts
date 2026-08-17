/** Department colors are assigned by the backend (encounter-order palette
 * index, never hardcoded to a department name). These helpers just derive
 * presentational variants (a light tint for backgrounds) from that hex value. */

const FALLBACK_COLOR = "#2563EB";

export function tint(hex: string | null | undefined, alpha: number): string {
  const color = hex || FALLBACK_COLOR;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
