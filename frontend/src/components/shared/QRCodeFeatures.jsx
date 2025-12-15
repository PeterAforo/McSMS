import { useState, useRef, useEffect } from 'react';
import { 
  QrCode, Download, Printer, Camera, X, Check, 
  User, CreditCard, Calendar, Loader2, RefreshCw
} from 'lucide-react';

// QR Code Generator using Canvas
export function QRCodeGenerator({ data, size = 200, title, subtitle }) {
  const canvasRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    generateQR();
  }, [data, size]);

  const generateQR = async () => {
    // Use a simple QR code generation algorithm or external library
    // For now, we'll use a placeholder that can be replaced with actual QR library
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    // Create QR code pattern (simplified - use qrcode library in production)
    const qrSize = size - 20;
    const moduleCount = 25;
    const moduleSize = qrSize / moduleCount;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Generate pattern from data
    const dataHash = hashCode(data);
    ctx.fillStyle = '#000000';
    
    // Draw finder patterns (corners)
    drawFinderPattern(ctx, 10, 10, moduleSize * 7);
    drawFinderPattern(ctx, size - 10 - moduleSize * 7, 10, moduleSize * 7);
    drawFinderPattern(ctx, 10, size - 10 - moduleSize * 7, moduleSize * 7);
    
    // Draw data modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // Skip finder pattern areas
        if (isFinderArea(row, col, moduleCount)) continue;
        
        // Use hash to determine if module is filled
        const index = row * moduleCount + col;
        const shouldFill = ((dataHash >> (index % 32)) & 1) === 1 || 
                          data.charCodeAt(index % data.length) % 2 === 0;
        
        if (shouldFill) {
          ctx.fillRect(
            10 + col * moduleSize,
            10 + row * moduleSize,
            moduleSize - 1,
            moduleSize - 1
          );
        }
      }
    }
    
    setQrDataUrl(canvas.toDataURL('image/png'));
  };

  const drawFinderPattern = (ctx, x, y, size) => {
    const moduleSize = size / 7;
    
    // Outer square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    
    // White middle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + moduleSize, y + moduleSize, size - moduleSize * 2, size - moduleSize * 2);
    
    // Inner square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, size - moduleSize * 4, size - moduleSize * 4);
  };

  const isFinderArea = (row, col, count) => {
    // Top-left
    if (row < 8 && col < 8) return true;
    // Top-right
    if (row < 8 && col >= count - 8) return true;
    // Bottom-left
    if (row >= count - 8 && col < 8) return true;
    return false;
  };

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `qr-${title || 'code'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
          <h2>${title || 'QR Code'}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
          <img src="${qrDataUrl}" style="width:300px;height:300px;" />
          <p style="margin-top:20px;font-size:12px;color:#666;">Scan to verify</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="bg-white p-4 rounded-xl shadow-lg">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {title && <p className="mt-3 font-semibold text-gray-900 dark:text-white">{title}</p>}
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </div>
  );
}

// Student ID Card with QR
export function StudentIDCard({ student, schoolName, schoolLogo }) {
  const qrData = JSON.stringify({
    type: 'student',
    id: student.id,
    student_id: student.student_id,
    name: `${student.first_name} ${student.last_name}`,
    class: student.class_name,
    timestamp: Date.now()
  });

  return (
    <div className="w-[350px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-white/10 px-4 py-3 flex items-center gap-3">
        {schoolLogo ? (
          <img src={schoolLogo} alt="School" className="w-12 h-12 rounded-full bg-white p-1" />
        ) : (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <h3 className="text-white font-bold">{schoolName || 'School Name'}</h3>
          <p className="text-white/70 text-xs">Student Identity Card</p>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4 flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          {student.photo ? (
            <img 
              src={student.photo} 
              alt={student.first_name}
              className="w-24 h-28 object-cover rounded-lg border-2 border-white/30"
            />
          ) : (
            <div className="w-24 h-28 bg-white/20 rounded-lg flex items-center justify-center">
              <User className="w-12 h-12 text-white/50" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 text-white">
          <h4 className="font-bold text-lg">{student.first_name} {student.last_name}</h4>
          <div className="space-y-1 mt-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-white/60">ID:</span>
              <span className="font-mono">{student.student_id}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-white/60">Class:</span>
              <span>{student.class_name}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-white/60">DOB:</span>
              <span>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* QR Code */}
      <div className="bg-white p-3 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Scan for verification</p>
          <p className="text-xs text-gray-400 mt-1">Valid: {new Date().getFullYear()}</p>
        </div>
        <div className="bg-white p-1 rounded">
          <QRCodeGenerator data={qrData} size={80} />
        </div>
      </div>
    </div>
  );
}

// QR Scanner Component
export function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      setError('Unable to access camera. Please grant permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Note: In production, use a QR scanning library like @zxing/library
  const simulateScan = () => {
    // Simulate successful scan for demo
    const mockResult = {
      type: 'student',
      id: 1,
      student_id: 'STU2024001',
      name: 'John Mensah',
      class: 'Class 6A'
    };
    setResult(mockResult);
    onScan(mockResult);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden max-w-md w-full">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-x-4 h-0.5 bg-blue-500 animate-scan" />
            </div>
          </div>
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-white text-center px-4">{error}</p>
            </div>
          )}
        </div>
        
        {result ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">Scan Successful!</p>
                <p className="text-sm text-green-600 dark:text-green-400">{result.name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              Position the QR code within the frame to scan
            </p>
            {/* Demo button - remove in production */}
            <button
              onClick={simulateScan}
              className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Simulate Scan (Demo)
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// QR Attendance Component
export function QRAttendance({ classId, className, onMarkAttendance }) {
  const [showScanner, setShowScanner] = useState(false);
  const [markedStudents, setMarkedStudents] = useState([]);

  const handleScan = (data) => {
    if (data.type === 'student' && !markedStudents.find(s => s.id === data.id)) {
      setMarkedStudents(prev => [...prev, { ...data, time: new Date() }]);
      onMarkAttendance?.(data);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Attendance</h3>
          <p className="text-sm text-gray-500">{className} - {new Date().toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Scan Student
        </button>
      </div>

      {markedStudents.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Marked Present: {markedStudents.length}
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {markedStudents.map((student, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.student_id}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {student.time.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No students marked yet</p>
          <p className="text-sm">Click "Scan Student" to start</p>
        </div>
      )}

      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

// Payment QR Code
export function PaymentQRCode({ invoice, amount, reference }) {
  const qrData = JSON.stringify({
    type: 'payment',
    invoice_id: invoice?.id,
    amount: amount,
    reference: reference,
    timestamp: Date.now()
  });

  return (
    <div className="text-center">
      <QRCodeGenerator 
        data={qrData} 
        size={200}
        title={`Pay GHS ${amount?.toLocaleString()}`}
        subtitle={`Ref: ${reference}`}
      />
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Scan with your mobile banking app to pay
      </p>
    </div>
  );
}
