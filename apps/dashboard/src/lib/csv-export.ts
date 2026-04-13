/**
 * CSV Export Utility — client-side CSV generation + download
 * No dependencies required.
 */

/**
 * Convert tabular data to a CSV string.
 * Handles quoting for values containing commas, quotes, or newlines.
 */
export function arrayToCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map(row => row.map(escape).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCsv(filename: string, csvString: string): void {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
