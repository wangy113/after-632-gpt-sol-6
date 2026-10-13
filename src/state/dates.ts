export const DATE_IDS = ['632', '661', '680'] as const;
export type DateId = typeof DATE_IDS[number];

export function previousDate(date: DateId): DateId | null {
  switch (date) {
    case '632': return null;
    case '661': return '632';
    case '680': return '661';
  }
}

export function dateChangeCaption(from: DateId, to: DateId): string | null {
  if (from === to) return null;
  const years = Math.abs(Number(to) - Number(from));
  return years + ' years ' + (Number(to) > Number(from) ? 'later' : 'earlier');
}
