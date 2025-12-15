/**
 * Export Service - Export data to various formats including Google Sheets
 */

// Export to CSV
export function exportToCSV(data, filename, headers = null) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Build CSV content
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        let value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) value = '';
        // Escape quotes and wrap in quotes if contains comma
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Download
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// Export to Excel (XLSX format using simple XML)
export function exportToExcel(data, filename, sheetName = 'Sheet1', headers = null) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const excelHeaders = headers || Object.keys(data[0]);
  
  // Create simple Excel XML
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheetName}">
<Table>
<Row>
${excelHeaders.map(h => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}
</Row>
${data.map(row => `<Row>
${excelHeaders.map(h => {
  const value = row[h];
  const type = typeof value === 'number' ? 'Number' : 'String';
  return `<Cell><Data ss:Type="${type}">${escapeXml(String(value ?? ''))}</Data></Cell>`;
}).join('')}
</Row>`).join('\n')}
</Table>
</Worksheet>
</Workbook>`;

  downloadFile(xml, `${filename}.xls`, 'application/vnd.ms-excel');
}

// Export to PDF (using browser print)
export function exportToPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('Element not found');
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Export to Google Sheets
export async function exportToGoogleSheets(data, title, headers = null) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return null;
  }

  const sheetHeaders = headers || Object.keys(data[0]);
  
  // Format data for Google Sheets
  const rows = [
    sheetHeaders,
    ...data.map(row => sheetHeaders.map(h => row[h] ?? ''))
  ];

  // Create a TSV (Tab Separated Values) that Google Sheets can import
  const tsvContent = rows.map(row => 
    row.map(cell => String(cell).replace(/\t/g, ' ')).join('\t')
  ).join('\n');

  // Option 1: Open Google Sheets with data (using URL scheme)
  const encodedData = encodeURIComponent(tsvContent);
  const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?title=${encodeURIComponent(title)}`;
  
  // Copy to clipboard and open Google Sheets
  try {
    await navigator.clipboard.writeText(tsvContent);
    
    // Show instructions
    const confirmed = confirm(
      'Data copied to clipboard!\n\n' +
      'Click OK to open Google Sheets.\n' +
      'Then press Ctrl+V (or Cmd+V) to paste the data.\n\n' +
      'Alternatively, you can download as CSV and import to Google Sheets.'
    );
    
    if (confirmed) {
      window.open(googleSheetsUrl, '_blank');
    }
    
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    // Fallback: download as CSV
    exportToCSV(data, title, headers);
    alert('Could not copy to clipboard. Downloaded as CSV instead.\nYou can import this file to Google Sheets.');
    return false;
  }
}

// Export with Google Sheets API (requires OAuth)
export async function exportToGoogleSheetsAPI(data, title, accessToken) {
  if (!accessToken) {
    alert('Please sign in with Google first');
    return null;
  }

  const headers = Object.keys(data[0]);
  const values = [
    headers,
    ...data.map(row => headers.map(h => row[h] ?? ''))
  ];

  try {
    // Create new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: 'Data' } }]
      })
    });

    if (!createResponse.ok) throw new Error('Failed to create spreadsheet');
    
    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // Add data to spreadsheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Data!A1:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!updateResponse.ok) throw new Error('Failed to add data');

    // Open the spreadsheet
    window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
    
    return spreadsheetId;
  } catch (error) {
    console.error('Google Sheets API error:', error);
    alert('Failed to export to Google Sheets. Please try again.');
    return null;
  }
}

// Export to JSON
export function exportToJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

// Print table
export function printTable(data, title, headers = null) {
  const tableHeaders = headers || Object.keys(data[0]);
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1e40af; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 20px; font-size: 10px; color: #666; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>${tableHeaders.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Generated on ${new Date().toLocaleString()} | Total Records: ${data.length}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Helper: Download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper: Escape XML special characters
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Export Button Component
import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from 'lucide-react';

export function ExportButton({ data, filename, headers = null, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    { label: 'Export to CSV', icon: FileText, action: () => exportToCSV(data, filename, headers) },
    { label: 'Export to Excel', icon: FileSpreadsheet, action: () => exportToExcel(data, filename, 'Data', headers) },
    { label: 'Export to Google Sheets', icon: FileSpreadsheet, action: () => exportToGoogleSheets(data, filename, headers) },
    { label: 'Export to JSON', icon: FileText, action: () => exportToJSON(data, filename) },
    { label: 'Print', icon: Printer, action: () => printTable(data, filename, headers) },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${className}`}
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            {exportOptions.map((option, i) => {
              const Icon = option.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    option.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
