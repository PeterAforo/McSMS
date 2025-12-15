<?php
/**
 * PDF Reports API
 * Generate PDF reports using DOMPDF
 */

header('Content-Type: application/pdf');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../backend/vendor/autoload.php';

use McSMS\Reports\PDFGenerator;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $type = $_GET['type'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? 'download'; // download or view

    // Initialize PDF Generator
    $schoolInfo = [
        'name' => 'McSMS School',
        'address' => 'P.O. Box 123, Accra, Ghana',
        'phone' => '+233 XX XXX XXXX',
        'email' => 'info@mcsms.edu.gh'
    ];
    
    $pdfGen = new PDFGenerator($schoolInfo);

    switch ($type) {
        case 'report_card':
            if (!$id) throw new Exception('Student ID required');
            
            $termId = $_GET['term_id'] ?? null;
            if (!$termId) throw new Exception('Term ID required');
            
            // Get student data
            $stmt = $pdo->prepare("
                SELECT s.*, c.class_name, c.level
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE s.id = ?
            ");
            $stmt->execute([$id]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student) throw new Exception('Student not found');
            
            // Get term data
            $stmt = $pdo->prepare("
                SELECT t.*, s.session_name
                FROM academic_terms t
                JOIN academic_sessions s ON t.session_id = s.id
                WHERE t.id = ?
            ");
            $stmt->execute([$termId]);
            $term = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get grades
            $stmt = $pdo->prepare("
                SELECT 
                    g.*,
                    s.subject_name,
                    a.assessment_name
                FROM grades g
                JOIN assessments a ON g.assessment_id = a.id
                JOIN subjects s ON a.subject_id = s.id
                WHERE g.student_id = ? AND a.term_id = ?
                ORDER BY s.subject_name
            ");
            $stmt->execute([$id, $termId]);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Generate PDF
            $pdf = $pdfGen->generateReportCard($student, $grades, $term);
            
            $filename = "Report_Card_{$student['student_id']}_" . date('Y-m-d') . ".pdf";
            
            if ($action === 'download') {
                header('Content-Disposition: attachment; filename="' . $filename . '"');
            } else {
                header('Content-Disposition: inline; filename="' . $filename . '"');
            }
            
            echo $pdf;
            break;

        case 'invoice':
            if (!$id) throw new Exception('Invoice ID required');
            
            // Get invoice data
            $stmt = $pdo->prepare("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE i.id = ?
            ");
            $stmt->execute([$id]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice) throw new Exception('Invoice not found');
            
            // Get invoice items
            $stmt = $pdo->prepare("
                SELECT * FROM invoice_items WHERE invoice_id = ?
            ");
            $stmt->execute([$id]);
            $invoice['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Generate PDF
            $pdf = $pdfGen->generateInvoice($invoice);
            
            $filename = "Invoice_{$invoice['invoice_number']}.pdf";
            
            if ($action === 'download') {
                header('Content-Disposition: attachment; filename="' . $filename . '"');
            } else {
                header('Content-Disposition: inline; filename="' . $filename . '"');
            }
            
            echo $pdf;
            break;

        case 'receipt':
            if (!$id) throw new Exception('Payment ID required');
            
            // Get payment data
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    i.invoice_number,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$payment) throw new Exception('Payment not found');
            
            // Generate receipt number if not exists
            if (empty($payment['receipt_number'])) {
                $payment['receipt_number'] = 'RCP-' . str_pad($payment['id'], 6, '0', STR_PAD_LEFT);
            }
            
            // Convert amount to words (simple implementation)
            $payment['amount_in_words'] = $this->numberToWords($payment['amount']) . ' Ghana Cedis';
            
            // Generate PDF
            $pdf = $pdfGen->generateReceipt($payment);
            
            $filename = "Receipt_{$payment['receipt_number']}.pdf";
            
            if ($action === 'download') {
                header('Content-Disposition: attachment; filename="' . $filename . '"');
            } else {
                header('Content-Disposition: inline; filename="' . $filename . '"');
            }
            
            echo $pdf;
            break;

        case 'transcript':
            if (!$id) throw new Exception('Student ID required');
            
            // Get student data
            $stmt = $pdo->prepare("
                SELECT s.*, c.class_name, c.level
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE s.id = ?
            ");
            $stmt->execute([$id]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student) throw new Exception('Student not found');
            
            // Get all grades grouped by term
            $stmt = $pdo->prepare("
                SELECT 
                    g.*,
                    s.subject_name,
                    a.assessment_name,
                    t.term_name,
                    ses.session_name
                FROM grades g
                JOIN assessments a ON g.assessment_id = a.id
                JOIN subjects s ON a.subject_id = s.id
                JOIN academic_terms t ON a.term_id = t.id
                JOIN academic_sessions ses ON t.session_id = ses.id
                WHERE g.student_id = ?
                ORDER BY ses.session_name, t.term_name, s.subject_name
            ");
            $stmt->execute([$id]);
            $allGrades = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Generate PDF
            $pdf = $pdfGen->generateTranscript($student, $allGrades);
            
            $filename = "Transcript_{$student['student_id']}_" . date('Y-m-d') . ".pdf";
            
            if ($action === 'download') {
                header('Content-Disposition: attachment; filename="' . $filename . '"');
            } else {
                header('Content-Disposition: inline; filename="' . $filename . '"');
            }
            
            echo $pdf;
            break;

        default:
            throw new Exception('Invalid report type');
    }

} catch (Exception $e) {
    // Reset headers for JSON error response
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function numberToWords($number) {
    $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    $teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    $number = number_format($number, 2, '.', '');
    list($whole, $decimal) = explode('.', $number);
    
    $whole = (int)$whole;
    $words = '';
    
    if ($whole >= 1000) {
        $thousands = floor($whole / 1000);
        $words .= $ones[$thousands] . ' Thousand ';
        $whole = $whole % 1000;
    }
    
    if ($whole >= 100) {
        $hundreds = floor($whole / 100);
        $words .= $ones[$hundreds] . ' Hundred ';
        $whole = $whole % 100;
    }
    
    if ($whole >= 20) {
        $tensDigit = floor($whole / 10);
        $onesDigit = $whole % 10;
        $words .= $tens[$tensDigit] . ' ' . $ones[$onesDigit];
    } elseif ($whole >= 10) {
        $words .= $teens[$whole - 10];
    } else {
        $words .= $ones[$whole];
    }
    
    if ($decimal > 0) {
        $words .= ' and ' . $decimal . '/100';
    }
    
    return trim($words);
}
