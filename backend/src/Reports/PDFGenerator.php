<?php
namespace McSMS\Reports;

use Dompdf\Dompdf;
use Dompdf\Options;

class PDFGenerator
{
    private $dompdf;
    private $schoolInfo;
    
    public function __construct($schoolInfo = [])
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Arial');
        
        $this->dompdf = new Dompdf($options);
        $this->schoolInfo = array_merge([
            'name' => 'McSMS School',
            'address' => 'Accra, Ghana',
            'phone' => '+233 XX XXX XXXX',
            'email' => 'info@mcsms.edu.gh',
            'logo' => ''
        ], $schoolInfo);
    }
    
    /**
     * Generate Student Report Card
     */
    public function generateReportCard($studentData, $grades, $term)
    {
        $html = $this->getReportCardTemplate($studentData, $grades, $term);
        $this->dompdf->loadHtml($html);
        $this->dompdf->setPaper('A4', 'portrait');
        $this->dompdf->render();
        
        return $this->dompdf->output();
    }
    
    /**
     * Generate Invoice PDF
     */
    public function generateInvoice($invoiceData)
    {
        $html = $this->getInvoiceTemplate($invoiceData);
        $this->dompdf->loadHtml($html);
        $this->dompdf->setPaper('A4', 'portrait');
        $this->dompdf->render();
        
        return $this->dompdf->output();
    }
    
    /**
     * Generate Payment Receipt
     */
    public function generateReceipt($paymentData)
    {
        $html = $this->getReceiptTemplate($paymentData);
        $this->dompdf->loadHtml($html);
        $this->dompdf->setPaper('A4', 'portrait');
        $this->dompdf->render();
        
        return $this->dompdf->output();
    }
    
    /**
     * Generate Attendance Report
     */
    public function generateAttendanceReport($attendanceData, $period)
    {
        $html = $this->getAttendanceTemplate($attendanceData, $period);
        $this->dompdf->loadHtml($html);
        $this->dompdf->setPaper('A4', 'landscape');
        $this->dompdf->render();
        
        return $this->dompdf->output();
    }
    
    /**
     * Generate Financial Statement
     */
    public function generateFinancialStatement($financialData, $period)
    {
        $html = $this->getFinancialStatementTemplate($financialData, $period);
        $this->dompdf->loadHtml($html);
        $this->dompdf->setPaper('A4', 'portrait');
        $this->dompdf->render();
        
        return $this->dompdf->output();
    }
    
    /**
     * Generate Student Transcript
     */
    public function generateTranscript($studentData, $allGrades)
    {
        $html = $this->getTranscriptTemplate($studentData, $allGrades);
        $this->dompdf->loadHtml($html);
        $this->dompdf->setPaper('A4', 'portrait');
        $this->dompdf->render();
        
        return $this->dompdf->output();
    }
    
    /**
     * Stream PDF to browser
     */
    public function stream($filename)
    {
        $this->dompdf->stream($filename, ['Attachment' => false]);
    }
    
    /**
     * Download PDF
     */
    public function download($filename)
    {
        $this->dompdf->stream($filename, ['Attachment' => true]);
    }
    
    // ============================================
    // TEMPLATE METHODS
    // ============================================
    
    private function getReportCardTemplate($student, $grades, $term)
    {
        $totalMarks = 0;
        $subjectCount = count($grades);
        
        foreach ($grades as $grade) {
            $totalMarks += $grade['total_marks'];
        }
        
        $average = $subjectCount > 0 ? round($totalMarks / $subjectCount, 2) : 0;
        $overallGrade = $this->calculateGrade($average);
        
        $gradesHtml = '';
        foreach ($grades as $grade) {
            $gradesHtml .= "
                <tr>
                    <td>{$grade['subject_name']}</td>
                    <td style='text-align: center;'>{$grade['ca_marks']}</td>
                    <td style='text-align: center;'>{$grade['exam_marks']}</td>
                    <td style='text-align: center;'>{$grade['total_marks']}</td>
                    <td style='text-align: center;'>{$grade['grade']}</td>
                    <td>{$grade['remarks']}</td>
                </tr>
            ";
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3F51B5; padding-bottom: 20px; }
                .header h1 { color: #3F51B5; margin: 5px 0; }
                .header p { margin: 3px 0; color: #666; }
                .student-info { margin: 20px 0; }
                .student-info table { width: 100%; border-collapse: collapse; }
                .student-info td { padding: 8px; border: 1px solid #ddd; }
                .student-info td:first-child { font-weight: bold; background: #f5f5f5; width: 30%; }
                .grades-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .grades-table th { background: #3F51B5; color: white; padding: 10px; text-align: left; }
                .grades-table td { padding: 8px; border: 1px solid #ddd; }
                .grades-table tr:nth-child(even) { background: #f9f9f9; }
                .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                .summary table { width: 100%; }
                .summary td { padding: 5px; }
                .summary td:first-child { font-weight: bold; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; }
                .signature { display: inline-block; width: 45%; text-align: center; margin-top: 50px; }
                .signature-line { border-top: 2px solid #000; margin-top: 40px; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>{$this->schoolInfo['name']}</h1>
                <p>{$this->schoolInfo['address']}</p>
                <p>Tel: {$this->schoolInfo['phone']} | Email: {$this->schoolInfo['email']}</p>
                <h2 style='color: #4CAF50; margin-top: 15px;'>STUDENT REPORT CARD</h2>
                <p><strong>{$term['term_name']} - {$term['session_name']}</strong></p>
            </div>
            
            <div class='student-info'>
                <table>
                    <tr>
                        <td>Student Name</td>
                        <td>{$student['first_name']} {$student['last_name']}</td>
                    </tr>
                    <tr>
                        <td>Student ID</td>
                        <td>{$student['student_id']}</td>
                    </tr>
                    <tr>
                        <td>Class</td>
                        <td>{$student['class_name']}</td>
                    </tr>
                    <tr>
                        <td>Date of Birth</td>
                        <td>{$student['date_of_birth']}</td>
                    </tr>
                </table>
            </div>
            
            <table class='grades-table'>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th style='text-align: center;'>CA (40%)</th>
                        <th style='text-align: center;'>Exam (60%)</th>
                        <th style='text-align: center;'>Total (100)</th>
                        <th style='text-align: center;'>Grade</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {$gradesHtml}
                </tbody>
            </table>
            
            <div class='summary'>
                <table>
                    <tr>
                        <td>Total Marks:</td>
                        <td><strong>{$totalMarks}</strong></td>
                    </tr>
                    <tr>
                        <td>Average:</td>
                        <td><strong>{$average}%</strong></td>
                    </tr>
                    <tr>
                        <td>Overall Grade:</td>
                        <td><strong style='color: #4CAF50; font-size: 18px;'>{$overallGrade}</strong></td>
                    </tr>
                </table>
            </div>
            
            <div class='footer'>
                <div class='signature' style='float: left;'>
                    <div class='signature-line'>Class Teacher</div>
                </div>
                <div class='signature' style='float: right;'>
                    <div class='signature-line'>Headmaster/Principal</div>
                </div>
                <div style='clear: both;'></div>
            </div>
            
            <p style='text-align: center; margin-top: 30px; color: #666; font-size: 12px;'>
                Generated on " . date('F j, Y') . "
            </p>
        </body>
        </html>
        ";
    }
    
    private function getInvoiceTemplate($invoice)
    {
        $itemsHtml = '';
        foreach ($invoice['items'] as $item) {
            $itemsHtml .= "
                <tr>
                    <td>{$item['description']}</td>
                    <td style='text-align: center;'>{$item['quantity']}</td>
                    <td style='text-align: right;'>GHS " . number_format($item['unit_price'], 2) . "</td>
                    <td style='text-align: right;'>GHS " . number_format($item['amount'], 2) . "</td>
                </tr>
            ";
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #3F51B5; margin: 5px 0; }
                .invoice-info { margin: 20px 0; }
                .invoice-info table { width: 100%; }
                .invoice-info td { padding: 5px; }
                .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .items-table th { background: #3F51B5; color: white; padding: 10px; text-align: left; }
                .items-table td { padding: 8px; border: 1px solid #ddd; }
                .total-section { margin-top: 20px; float: right; width: 300px; }
                .total-section table { width: 100%; border-collapse: collapse; }
                .total-section td { padding: 8px; border: 1px solid #ddd; }
                .total-section .grand-total { background: #3F51B5; color: white; font-weight: bold; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>{$this->schoolInfo['name']}</h1>
                <p>{$this->schoolInfo['address']}</p>
                <p>Tel: {$this->schoolInfo['phone']} | Email: {$this->schoolInfo['email']}</p>
                <h2 style='color: #4CAF50;'>INVOICE</h2>
            </div>
            
            <div class='invoice-info'>
                <table>
                    <tr>
                        <td style='width: 50%;'>
                            <strong>Bill To:</strong><br>
                            {$invoice['student_name']}<br>
                            {$invoice['class_name']}<br>
                            Student ID: {$invoice['student_id']}
                        </td>
                        <td style='width: 50%; text-align: right;'>
                            <strong>Invoice #:</strong> {$invoice['invoice_number']}<br>
                            <strong>Date:</strong> {$invoice['invoice_date']}<br>
                            <strong>Due Date:</strong> {$invoice['due_date']}<br>
                            <strong>Status:</strong> <span style='color: " . $this->getStatusColor($invoice['status']) . ";'>{$invoice['status']}</span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <table class='items-table'>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style='text-align: center;'>Quantity</th>
                        <th style='text-align: right;'>Unit Price</th>
                        <th style='text-align: right;'>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {$itemsHtml}
                </tbody>
            </table>
            
            <div class='total-section'>
                <table>
                    <tr>
                        <td>Subtotal:</td>
                        <td style='text-align: right;'>GHS " . number_format($invoice['subtotal'], 2) . "</td>
                    </tr>
                    <tr>
                        <td>Paid Amount:</td>
                        <td style='text-align: right;'>GHS " . number_format($invoice['paid_amount'], 2) . "</td>
                    </tr>
                    <tr class='grand-total'>
                        <td>Balance Due:</td>
                        <td style='text-align: right;'>GHS " . number_format($invoice['balance'], 2) . "</td>
                    </tr>
                </table>
            </div>
            
            <div style='clear: both; margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd;'>
                <p><strong>Payment Instructions:</strong></p>
                <p>Please make payment to the school finance office or via mobile money.</p>
                <p style='margin-top: 30px; text-align: center; color: #666;'>Thank you for your payment!</p>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getReceiptTemplate($payment)
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; }
                .header h1 { color: #3F51B5; margin: 5px 0; }
                .receipt-box { border: 2px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 10px; }
                .receipt-info table { width: 100%; border-collapse: collapse; }
                .receipt-info td { padding: 10px; border-bottom: 1px solid #ddd; }
                .receipt-info td:first-child { font-weight: bold; width: 40%; }
                .amount-box { background: #4CAF50; color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
                .amount-box h2 { margin: 0; font-size: 32px; }
            </style>
        </head>
        <body>
            <div class='header'>
                <h1>{$this->schoolInfo['name']}</h1>
                <p>{$this->schoolInfo['address']}</p>
                <p>Tel: {$this->schoolInfo['phone']} | Email: {$this->schoolInfo['email']}</p>
                <h2 style='color: #4CAF50;'>PAYMENT RECEIPT</h2>
            </div>
            
            <div class='receipt-box'>
                <div class='receipt-info'>
                    <table>
                        <tr>
                            <td>Receipt Number:</td>
                            <td><strong>{$payment['receipt_number']}</strong></td>
                        </tr>
                        <tr>
                            <td>Date:</td>
                            <td>{$payment['payment_date']}</td>
                        </tr>
                        <tr>
                            <td>Student Name:</td>
                            <td>{$payment['student_name']}</td>
                        </tr>
                        <tr>
                            <td>Student ID:</td>
                            <td>{$payment['student_id']}</td>
                        </tr>
                        <tr>
                            <td>Class:</td>
                            <td>{$payment['class_name']}</td>
                        </tr>
                        <tr>
                            <td>Invoice Number:</td>
                            <td>{$payment['invoice_number']}</td>
                        </tr>
                        <tr>
                            <td>Payment Method:</td>
                            <td>{$payment['payment_method']}</td>
                        </tr>
                        <tr>
                            <td>Reference:</td>
                            <td>{$payment['reference']}</td>
                        </tr>
                    </table>
                </div>
                
                <div class='amount-box'>
                    <p style='margin: 0; font-size: 14px;'>Amount Paid</p>
                    <h2>GHS " . number_format($payment['amount'], 2) . "</h2>
                </div>
                
                <p style='text-align: center; margin-top: 20px;'>
                    <strong>Amount in Words:</strong> {$payment['amount_in_words']}
                </p>
            </div>
            
            <div style='margin-top: 50px;'>
                <div style='float: right; text-align: center; width: 200px;'>
                    <div style='border-top: 2px solid #000; margin-top: 40px; padding-top: 5px;'>
                        Authorized Signature
                    </div>
                </div>
                <div style='clear: both;'></div>
            </div>
            
            <p style='text-align: center; margin-top: 30px; color: #666; font-size: 12px;'>
                This is a computer-generated receipt. Generated on " . date('F j, Y g:i A') . "
            </p>
        </body>
        </html>
        ";
    }
    
    private function getAttendanceTemplate($data, $period)
    {
        // Implementation for attendance report
        return "<!-- Attendance Report Template -->";
    }
    
    private function getFinancialStatementTemplate($data, $period)
    {
        // Implementation for financial statement
        return "<!-- Financial Statement Template -->";
    }
    
    private function getTranscriptTemplate($student, $allGrades)
    {
        // Implementation for transcript
        return "<!-- Transcript Template -->";
    }
    
    // Helper methods
    private function calculateGrade($marks)
    {
        if ($marks >= 80) return 'A';
        if ($marks >= 70) return 'B';
        if ($marks >= 60) return 'C';
        if ($marks >= 50) return 'D';
        return 'F';
    }
    
    private function getStatusColor($status)
    {
        $colors = [
            'paid' => '#4CAF50',
            'partial' => '#FF9800',
            'unpaid' => '#F44336',
            'overdue' => '#D32F2F'
        ];
        return $colors[strtolower($status)] ?? '#666';
    }
}
