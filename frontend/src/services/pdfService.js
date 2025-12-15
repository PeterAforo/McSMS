import axios from 'axios';

const PDF_API_BASE = 'https://eea.mcaforo.com/backend/api/pdf_reports.php';

/**
 * PDF Service for generating and downloading PDF reports
 */
export const pdfService = {
  /**
   * Generate and download student report card
   */
  downloadReportCard: async (studentId, termId) => {
    try {
      const response = await axios.get(PDF_API_BASE, {
        params: {
          type: 'report_card',
          id: studentId,
          term_id: termId,
          action: 'download'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_Card_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading report card:', error);
      throw error;
    }
  },

  /**
   * View student report card in new tab
   */
  viewReportCard: async (studentId, termId) => {
    const url = `${PDF_API_BASE}?type=report_card&id=${studentId}&term_id=${termId}&action=view`;
    window.open(url, '_blank');
  },

  /**
   * Generate and download invoice PDF
   */
  downloadInvoice: async (invoiceId) => {
    try {
      const response = await axios.get(PDF_API_BASE, {
        params: {
          type: 'invoice',
          id: invoiceId,
          action: 'download'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },

  /**
   * View invoice PDF in new tab
   */
  viewInvoice: (invoiceId) => {
    const url = `${PDF_API_BASE}?type=invoice&id=${invoiceId}&action=view`;
    window.open(url, '_blank');
  },

  /**
   * Generate and download payment receipt
   */
  downloadReceipt: async (paymentId) => {
    try {
      const response = await axios.get(PDF_API_BASE, {
        params: {
          type: 'receipt',
          id: paymentId,
          action: 'download'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw error;
    }
  },

  /**
   * View payment receipt in new tab
   */
  viewReceipt: (paymentId) => {
    const url = `${PDF_API_BASE}?type=receipt&id=${paymentId}&action=view`;
    window.open(url, '_blank');
  },

  /**
   * Generate and download student transcript
   */
  downloadTranscript: async (studentId) => {
    try {
      const response = await axios.get(PDF_API_BASE, {
        params: {
          type: 'transcript',
          id: studentId,
          action: 'download'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Transcript_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading transcript:', error);
      throw error;
    }
  },

  /**
   * View student transcript in new tab
   */
  viewTranscript: (studentId) => {
    const url = `${PDF_API_BASE}?type=transcript&id=${studentId}&action=view`;
    window.open(url, '_blank');
  }
};

export default pdfService;
