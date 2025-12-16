import { useState, useEffect, useRef } from 'react';
import { User, GraduationCap } from 'lucide-react';

// Standard CR80 ID Card dimensions: 85.6mm x 53.98mm (3.375" x 2.125")
// At 300 DPI: 1012 x 638 pixels
// For screen display at 96 DPI: 323 x 204 pixels (scaled up for visibility)

const CARD_WIDTH = '323px';
const CARD_HEIGHT = '204px';

// Function to extract dominant colors from an image
const extractColorsFromImage = (imgSrc, callback) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Sample colors from the image
      const colorCounts = {};
      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip transparent or near-white/black pixels
        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 15 && g < 15 && b < 15) continue;
        
        // Quantize colors to reduce variations
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        const key = `${qr},${qg},${qb}`;
        
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
      
      // Sort by frequency and get top colors
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return `rgb(${r},${g},${b})`;
        });
      
      if (sortedColors.length >= 2) {
        callback(sortedColors[0], sortedColors[1]);
      } else if (sortedColors.length === 1) {
        callback(sortedColors[0], sortedColors[0]);
      }
    } catch (e) {
      console.log('Could not extract colors from logo');
    }
  };
  img.onerror = () => {
    console.log('Could not load logo image for color extraction');
  };
  img.src = imgSrc;
};

export default function StudentIdCard({ student, schoolSettings, apiBaseUrl }) {
  const [primaryColor, setPrimaryColor] = useState('#1e40af');
  const [secondaryColor, setSecondaryColor] = useState('#3b82f6');
  const colorExtracted = useRef(false);

  // Extract colors from school logo on mount
  useEffect(() => {
    if (schoolSettings.school_logo && !colorExtracted.current) {
      colorExtracted.current = true;
      extractColorsFromImage(schoolSettings.school_logo, (primary, secondary) => {
        setPrimaryColor(primary);
        setSecondaryColor(secondary);
      });
    }
  }, [schoolSettings.school_logo]);
  
  const getPhotoUrl = () => {
    const photo = student.profile_picture || student.photo || student.id_card?.photo_path;
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    // Remove leading slash and 'uploads/' if present to avoid duplication
    const cleanPath = photo.replace(/^\/?(uploads\/)?/, '');
    return `${apiBaseUrl.replace('/backend/api', '')}/uploads/${cleanPath}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card - ${student.first_name} ${student.last_name}</title>
          <style>
            @page {
              size: 85.6mm 53.98mm;
              margin: 0;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            body { font-family: Arial, sans-serif; }
            .page { page-break-after: always; width: 85.6mm; height: 53.98mm; }
            .page:last-child { page-break-after: auto; }
            .id-card { width: 85.6mm; height: 53.98mm; border-radius: 3mm; overflow: hidden; position: relative; }
            .id-card-front { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); }
            .id-card-back { background: #ffffff; border: 1px solid #e5e7eb; }
            .header { background: rgba(255,255,255,0.15); padding: 2mm; display: flex; align-items: center; gap: 2mm; border-bottom: 0.5mm solid rgba(255,255,255,0.2); }
            .logo { width: 10mm; height: 10mm; border-radius: 50%; object-fit: cover; background: white; padding: 0.5mm; }
            .logo-placeholder { width: 10mm; height: 10mm; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
            .school-name { flex: 1; text-align: center; color: white; }
            .school-name h1 { font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
            .school-name p { font-size: 6pt; opacity: 0.9; }
            .title-bar { background: #f59e0b; color: white; text-align: center; font-size: 6pt; font-weight: bold; padding: 1mm 0; letter-spacing: 1px; }
            .content { padding: 2mm; display: flex; gap: 2mm; color: white; }
            .photo { width: 18mm; height: 22mm; border-radius: 1.5mm; object-fit: cover; border: 0.5mm solid white; flex-shrink: 0; }
            .photo-placeholder { width: 18mm; height: 22mm; border-radius: 1.5mm; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; border: 0.5mm solid rgba(255,255,255,0.5); flex-shrink: 0; }
            .details { flex: 1; font-size: 6pt; }
            .details .name { font-size: 9pt; font-weight: bold; margin-bottom: 1mm; line-height: 1.2; }
            .details .student-id { font-size: 6pt; opacity: 0.8; font-family: monospace; margin-bottom: 2mm; }
            .details .info-row { display: flex; margin-bottom: 0.5mm; }
            .details .label { opacity: 0.7; width: 12mm; }
            .details .value { font-weight: 600; }
            .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5mm 2mm; border-top: 0.3mm solid rgba(255,255,255,0.2); display: flex; justify-content: space-between; font-size: 5pt; color: white; }
            .footer .card-no { font-family: monospace; font-weight: bold; letter-spacing: 0.5px; }
            
            /* Back card styles */
            .back-header { background: ${primaryColor}; color: white; text-align: center; padding: 1.5mm; font-size: 7pt; font-weight: bold; text-transform: uppercase; }
            .back-content { padding: 2mm; display: flex; gap: 2mm; }
            .emergency { flex: 1; font-size: 6pt; color: #374151; }
            .emergency h3 { font-size: 6pt; font-weight: bold; color: ${primaryColor}; margin-bottom: 1mm; text-transform: uppercase; }
            .emergency .row { margin-bottom: 0.5mm; }
            .emergency .label { color: #6b7280; }
            .qr-section { text-align: center; }
            .qr-code { width: 14mm; height: 14mm; border: 0.3mm solid #e5e7eb; border-radius: 1mm; }
            .qr-label { font-size: 5pt; color: #9ca3af; margin-top: 0.5mm; }
            .back-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5mm 2mm; border-top: 0.3mm solid #e5e7eb; text-align: center; font-size: 5pt; color: #6b7280; }
            .back-footer .school { font-weight: 600; color: ${primaryColor}; margin-bottom: 0.5mm; }
            .back-footer .contact { font-size: 5pt; }
            .back-footer .return-msg { font-size: 4.5pt; color: #9ca3af; margin-top: 1mm; font-style: italic; }
            
            @media print {
              body { margin: 0; }
              .page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <!-- Front of Card -->
          <div class="page">
            <div class="id-card id-card-front">
              <div class="header">
                ${schoolSettings.school_logo 
                  ? `<img src="${schoolSettings.school_logo}" class="logo" alt="Logo" />`
                  : `<div class="logo-placeholder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>`
                }
                <div class="school-name">
                  <h1>${schoolSettings.school_name || 'School Name'}</h1>
                  <p>${schoolSettings.school_phone || ''}</p>
                </div>
              </div>
              <div class="title-bar">STUDENT IDENTITY CARD</div>
              <div class="content">
                ${getPhotoUrl() 
                  ? `<img src="${getPhotoUrl()}" class="photo" alt="${student.first_name}" />`
                  : `<div class="photo-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`
                }
                <div class="details">
                  <div class="name">${student.first_name} ${student.last_name}</div>
                  <div class="student-id">${student.student_id}</div>
                  <div class="info-row"><span class="label">Class:</span><span class="value">${student.class_name || 'N/A'}</span></div>
                  <div class="info-row"><span class="label">Teacher:</span><span class="value">${student.class_teacher || 'N/A'}</span></div>
                  <div class="info-row"><span class="label">Gender:</span><span class="value" style="text-transform:capitalize">${student.gender}</span></div>
                  <div class="info-row"><span class="label">Admitted:</span><span class="value">${new Date(student.admission_date).getFullYear()}</span></div>
                </div>
              </div>
              <div class="footer">
                <div><span style="opacity:0.7">Card No:</span> <span class="card-no">${student.id_card?.card_number || ''}</span></div>
                <div><span style="opacity:0.7">Valid:</span> ${student.id_card ? new Date(student.id_card.expiry_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}</div>
              </div>
            </div>
          </div>
          
          <!-- Back of Card -->
          <div class="page">
            <div class="id-card id-card-back">
              <div class="back-header">Emergency Contact Information</div>
              <div class="back-content">
                <div class="emergency">
                  <div class="row"><span class="label">Guardian: </span>${student.guardian_name || 'N/A'}</div>
                  <div class="row"><span class="label">Phone: </span>${student.guardian_phone || 'N/A'}</div>
                  <div class="row"><span class="label">Address: </span>${student.address || 'N/A'}</div>
                </div>
                <div class="qr-section">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(schoolSettings.school_website || schoolSettings.school_email || 'https://school.edu')}" class="qr-code" alt="QR" />
                  <div class="qr-label">Scan Me</div>
                </div>
              </div>
              <div class="back-footer">
                <div class="school">${schoolSettings.school_name || 'School Name'}</div>
                <div class="contact">${schoolSettings.school_address || ''}</div>
                <div class="contact">Tel: ${schoolSettings.school_phone || ''} | ${schoolSettings.school_email || ''}</div>
                <div class="return-msg">If found, please return to the school address above.</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Color Picker for Card Theme */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <label className="text-sm font-medium text-gray-700">Card Theme:</label>
        <div className="flex items-center gap-2">
          <input 
            type="color" 
            value={primaryColor.startsWith('rgb') ? '#1e40af' : primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-2 border-gray-300"
            title="Primary color"
          />
          <input 
            type="color" 
            value={secondaryColor.startsWith('rgb') ? '#3b82f6' : secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-2 border-gray-300"
            title="Secondary color"
          />
        </div>
        <span className="text-xs text-gray-500">(Auto-extracted from logo)</span>
      </div>

      {/* Cards Side by Side */}
      <div className="flex flex-wrap justify-center gap-6">
        {/* Front of Card Preview */}
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600 mb-2">Front</p>
          <div 
            className="rounded-xl overflow-hidden shadow-xl"
            style={{ 
              width: CARD_WIDTH, 
              height: CARD_HEIGHT,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 p-2 bg-white/10 border-b border-white/20">
              {schoolSettings.school_logo ? (
                <img src={schoolSettings.school_logo} alt="Logo" className="w-10 h-10 rounded-full object-cover bg-white p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <GraduationCap className="text-white" size={20} />
                </div>
              )}
              <div className="flex-1 text-center text-white">
                <h4 className="font-bold text-xs uppercase tracking-wide">{schoolSettings.school_name || 'School Name'}</h4>
                <p className="text-[10px] text-white/80">{schoolSettings.school_phone}</p>
              </div>
            </div>
            
            {/* Title Bar */}
            <div className="bg-amber-500 text-white text-center text-[10px] font-bold py-0.5 tracking-wider">
              STUDENT IDENTITY CARD
            </div>
            
            {/* Content */}
            <div className="p-2 flex gap-2 text-white">
              {/* Photo */}
              {getPhotoUrl() ? (
                <img src={getPhotoUrl()} alt={student.first_name} className="w-16 h-20 rounded object-cover border-2 border-white flex-shrink-0" />
              ) : (
                <div className="w-16 h-20 rounded bg-white/20 flex items-center justify-center border border-white/50 flex-shrink-0">
                  <User className="text-white/70" size={28} />
                </div>
              )}
              
              {/* Details */}
              <div className="flex-1 text-[10px]">
                <p className="font-bold text-sm leading-tight">{student.first_name} {student.last_name}</p>
                <p className="text-white/70 font-mono text-[9px]">{student.student_id}</p>
                <div className="mt-1 space-y-0.5">
                  <p><span className="text-white/60">Class:</span> <span className="font-semibold">{student.class_name || 'N/A'}</span></p>
                  <p><span className="text-white/60">Teacher:</span> <span className="font-semibold">{student.class_teacher || 'N/A'}</span></p>
                  <p><span className="text-white/60">Gender:</span> <span className="capitalize">{student.gender}</span></p>
                  <p><span className="text-white/60">Admitted:</span> {new Date(student.admission_date).getFullYear()}</p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-2 py-1 border-t border-white/20 flex justify-between text-[9px] text-white">
              <div><span className="text-white/60">Card No:</span> <span className="font-mono font-bold">{student.id_card?.card_number}</span></div>
              <div><span className="text-white/60">Valid:</span> {student.id_card && new Date(student.id_card.expiry_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* Back of Card Preview */}
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-gray-600 mb-2">Back</p>
          <div 
            className="rounded-xl overflow-hidden shadow-xl bg-white border border-gray-200"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          >
            {/* Header */}
            <div className="text-white text-center text-[10px] font-bold py-1 uppercase tracking-wide" style={{ background: primaryColor }}>
              Emergency Contact Information
            </div>
            
            {/* Content */}
            <div className="p-2 flex gap-2">
              <div className="flex-1 text-[10px] text-gray-700">
                <div className="space-y-0.5">
                  <p><span className="text-gray-500">Guardian:</span> {student.guardian_name || 'N/A'}</p>
                  <p><span className="text-gray-500">Phone:</span> {student.guardian_phone || 'N/A'}</p>
                  <p><span className="text-gray-500">Address:</span> {student.address || 'N/A'}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(schoolSettings.school_website || schoolSettings.school_email || 'https://school.edu')}`}
                  alt="QR"
                  className="w-12 h-12 border rounded"
                />
                <p className="text-[8px] text-gray-400 mt-0.5">Scan Me</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-2 py-1 border-t text-center text-[9px]">
              <p className="font-semibold" style={{ color: primaryColor }}>{schoolSettings.school_name}</p>
              <p className="text-gray-500 text-[8px]">{schoolSettings.school_address}</p>
              <p className="text-gray-500 text-[8px]">Tel: {schoolSettings.school_phone} | {schoolSettings.school_email}</p>
              <p className="text-gray-400 text-[7px] italic mt-0.5">If found, please return to the school address above.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="text-center pt-2">
        <button 
          onClick={handlePrint}
          className="btn bg-gray-700 text-white hover:bg-gray-800 px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print ID Card
        </button>
        <p className="text-xs text-gray-500 mt-2">Standard CR80 size (85.6mm × 54mm) • Prints front and back</p>
      </div>
    </div>
  );
}
