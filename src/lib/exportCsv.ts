/**
 * Converts an array of objects into a downloadable CSV file in the browser.
 */
export function downloadCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const columns = headers || Object.keys(data[0]).map((key) => ({ key: key as keyof T, label: key }));

  const headerRow = columns.map((col) => `"${String(col.label).replace(/"/g, '""')}"`).join(',');

  const rows = data.map((item) =>
    columns
      .map((col) => {
        const val = item[col.key];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') {
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
