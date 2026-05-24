/**
 * exportUtils.js
 * Lightweight utilities for exporting data without heavy external dependencies.
 */

/**
 * Converts an array of objects into a CSV file and triggers a browser download.
 * 
 * @param {string} filename - The desired name of the downloaded file (e.g. 'report.csv')
 * @param {Array<Object>} columns - Array of column configurations: { key: 'firstName', label: 'First Name' }
 * @param {Array<Object>} data - Array of data objects
 */
export function exportToCSV(filename, columns, data) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Generate header row
  const headerRow = columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Generate data rows
  const dataRows = data.map(row => {
    return columns.map(col => {
      // Access nested properties if needed, e.g. "student.classes.name"
      const keys = col.key.split('.');
      let val = row;
      for (let k of keys) {
        if (val === null || val === undefined) break;
        val = val[k];
      }
      
      const safeVal = val !== null && val !== undefined ? String(val).replace(/"/g, '""') : '';
      return `"${safeVal}"`;
    }).join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
