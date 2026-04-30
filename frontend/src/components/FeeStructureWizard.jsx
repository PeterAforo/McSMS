import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, X, Star, Settings, FileText, DollarSign, Calendar } from 'lucide-react';

export default function FeeStructureWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    groups: [],
    items: [],
    rules: [],
    plans: []
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, title: 'Welcome', icon: Star },
    { id: 2, title: 'Fee Groups', icon: FileText },
    { id: 3, title: 'Fee Items', icon: Settings },
    { id: 4, title: 'Rules', icon: DollarSign },
    { id: 5, title: 'Installment Plans', icon: Calendar }
  ];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    onComplete(setupData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fee Structure Setup Wizard</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
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

      {/* Step Content */}
      <div className="bg-gray-50 rounded-lg p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-lg">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Welcome to Fee Structure Setup</h4>
                <p className="text-gray-600">This wizard will guide you through setting up your school's fee structure in 5 simple steps.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium mb-2">Step 1: Fee Groups</h5>
                <p className="text-sm text-gray-600">Create categories like Tuition, Books, Activities</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium mb-2">Step 2: Fee Items</h5>
                <p className="text-sm text-gray-600">Add specific fees under each group</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium mb-2">Step 3: Rules</h5>
                <p className="text-sm text-gray-600">Set pricing for each class/level</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h5 className="font-medium mb-2">Step 4: Installment Plans</h5>
                <p className="text-sm text-gray-600">Configure payment schedules</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Fee Groups Setup</h4>
            <p className="text-sm text-gray-600">Create fee groups to organize your fees (e.g., Tuition, Books, Activities)</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              This is a simplified wizard. For full functionality, use the main Fee Structure page with templates or bulk operations.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Fee Items Setup</h4>
            <p className="text-sm text-gray-600">Add specific fee items under your groups</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              Use the Bulk Rule Generator after creating items to quickly set up pricing rules.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Rules Configuration</h4>
            <p className="text-sm text-gray-600">Set pricing rules for different classes and levels</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              Use the Copy from Previous Year feature to quickly set up rules for a new academic year.
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Installment Plans & Review</h4>
            <p className="text-sm text-gray-600">Configure payment schedules and review your complete fee structure</p>
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
              Your fee structure is now ready! Use the main Fee Structure page to make adjustments and manage your fees going forward.
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-4 rounded border text-center">
                <div className="text-2xl font-bold text-blue-600">{setupData.groups.length}</div>
                <div className="text-sm text-gray-600">Groups</div>
              </div>
              <div className="bg-white p-4 rounded border text-center">
                <div className="text-2xl font-bold text-blue-600">{setupData.items.length}</div>
                <div className="text-sm text-gray-600">Items</div>
              </div>
              <div className="bg-white p-4 rounded border text-center">
                <div className="text-2xl font-bold text-blue-600">{setupData.rules.length}</div>
                <div className="text-sm text-gray-600">Rules</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`px-4 py-2 rounded ${step === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Back
        </button>
        {step === steps.length ? (
          <button onClick={handleComplete} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Complete Setup
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
