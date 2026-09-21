/** Dates are stored as plain YYYY-MM-DD and rendered in a fixed locale so the
 * build output and the client agree regardless of where either runs. */
export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
