import { useState } from 'react';
import { Calendar, ChevronRight, Check, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AcademicCalendarSetup({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    year_name: '',
    terms_count: 3,
    term_duration: 90,
    start_date: ''
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/academic_calendar.php?action=setup_year`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        onComplete(data);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to setup academic calendar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Academic Year', icon: Calendar },
    { id: 2, title: 'Terms Configuration', icon: Calendar },
    { id: 3, title: 'Review & Create', icon: Check }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Academic Calendar Setup</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <span className={`text-sm ${step >= s.id ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {s.title}
            </span>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Academic Year Name *</label>
            <input
              type="text"
              value={formData.year_name}
              onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
              placeholder="e.g., 2024/2025"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Format: YYYY/YYYY (e.g., 2024/2025)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Start Date *</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="input"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Number of Terms per Year *</label>
            <select
              value={formData.terms_count}
              onChange={(e) => setFormData({ ...formData, terms_count: parseInt(e.target.value) })}
              className="input"
            >
              <option value="2">2 Terms</option>
              <option value="3">3 Terms</option>
              <option value="4">4 Terms</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration per Term (days) *</label>
            <input
              type="number"
              value={formData.term_duration}
              onChange={(e) => setFormData({ ...formData, term_duration: parseInt(e.target.value) })}
              className="input"
              min="30"
              max="180"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 90 days (3 months)</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <p className="font-medium text-blue-800">Preview:</p>
            <p className="text-blue-700 mt-1">
              {formData.terms_count} terms × {formData.term_duration} days each = {formData.terms_count * formData.term_duration} days total
            </p>
            <p className="text-blue-700">
              Academic year: {formData.year_name || '2024/2025'}
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded p-4">
            <h4 className="font-medium mb-3">Configuration Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Academic Year:</span>
                <span className="font-medium">{formData.year_name || '2024/2025'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{formData.start_date || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Number of Terms:</span>
                <span className="font-medium">{formData.terms_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration per Term:</span>
                <span className="font-medium">{formData.term_duration} days</span>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
            <p><strong>Terms will be created automatically:</strong></p>
            <ul className="mt-2 space-y-1">
              {Array.from({ length: formData.terms_count }, (_, i) => (
                <li key={i}>Term {i + 1}: {formData.start_date ? new Date(new Date(formData.start_date).getTime() + (i * formData.term_duration * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 'TBD'}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`px-4 py-2 rounded ${step === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Back
        </button>
        {step === 3 ? (
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? 'Creating...' : 'Create Academic Calendar'}
          </button>
        ) : (
          <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Next
          </button>
        )}
      </div>
    </div>
  );
}
