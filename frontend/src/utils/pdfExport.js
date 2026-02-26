/**
 * Lazy PDF Export Utility
 * Dynamically imports jsPDF and html2canvas only when needed
 * This reduces initial bundle size by ~600KB
 */

let jsPDFModule = null;
let html2canvasModule = null;

/**
 * Lazily load jsPDF
 */
export const getJsPDF = async () => {
  if (!jsPDFModule) {
    const module = await import('jspdf');
    jsPDFModule = module.default || module.jsPDF;
  }
  return jsPDFModule;
};

/**
 * Lazily load jsPDF with autoTable plugin
 */
export const getJsPDFWithAutoTable = async () => {
  if (!jsPDFModule) {
    const [jspdfModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    jsPDFModule = jspdfModule.default || jspdfModule.jsPDF;
  }
  return jsPDFModule;
};

/**
 * Lazily load html2canvas
 */
export const getHtml2Canvas = async () => {
  if (!html2canvasModule) {
    const module = await import('html2canvas');
    html2canvasModule = module.default;
  }
  return html2canvasModule;
};

/**
 * Export element to PDF using html2canvas
 * @param {HTMLElement} element - DOM element to capture
 * @param {string} filename - Output filename
 * @param {object} options - PDF options
 */
export const exportElementToPDF = async (element, filename = 'export.pdf', options = {}) => {
  const [jsPDF, html2canvas] = await Promise.all([
    getJsPDF(),
    getHtml2Canvas()
  ]);

  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    useCORS: true,
    logging: false,
    ...options.canvasOptions
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.format || 'a4'
  });

  const imgWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(filename);

  return pdf;
};

/**
 * Export data table to PDF
 * @param {Array} columns - Column definitions [{header: 'Name', dataKey: 'name'}]
 * @param {Array} data - Array of row objects
 * @param {string} filename - Output filename
 * @param {object} options - PDF options
 */
export const exportTableToPDF = async (columns, data, filename = 'table.pdf', options = {}) => {
  const jsPDF = await getJsPDFWithAutoTable();
  
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.format || 'a4'
  });

  // Add title if provided
  if (options.title) {
    pdf.setFontSize(16);
    pdf.text(options.title, 14, 15);
  }

  // Add table
  pdf.autoTable({
    columns: columns,
    body: data,
    startY: options.title ? 25 : 15,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    ...options.tableOptions
  });

  pdf.save(filename);
  return pdf;
};

/**
 * Generate PDF report with header, content, and footer
 * @param {object} config - Report configuration
 */
export const generateReport = async (config) => {
  const {
    title,
    subtitle,
    content,
    filename = 'report.pdf',
    orientation = 'portrait',
    format = 'a4'
  } = config;

  const jsPDF = await getJsPDFWithAutoTable();
  const pdf = new jsPDF({ orientation, unit: 'mm', format });

  let yPos = 15;

  // Header
  if (title) {
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, 14, yPos);
    yPos += 8;
  }

  if (subtitle) {
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100);
    pdf.text(subtitle, 14, yPos);
    pdf.setTextColor(0);
    yPos += 10;
  }

  // Content sections
  if (content && Array.isArray(content)) {
    for (const section of content) {
      if (section.type === 'table' && section.columns && section.data) {
        pdf.autoTable({
          columns: section.columns,
          body: section.data,
          startY: yPos,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] },
          ...section.options
        });
        yPos = pdf.lastAutoTable.finalY + 10;
      } else if (section.type === 'text') {
        pdf.setFontSize(section.fontSize || 10);
        pdf.text(section.text, 14, yPos);
        yPos += (section.lineHeight || 6);
      }
    }
  }

  // Footer with date
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
      14,
      pdf.internal.pageSize.getHeight() - 10
    );
  }

  pdf.save(filename);
  return pdf;
};
