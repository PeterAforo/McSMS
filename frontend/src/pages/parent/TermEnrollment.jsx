import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, DollarSign } from 'lucide-react';
import { studentsAPI, termsAPI, feeItemsAPI, financeAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TermEnrollment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [children, setChildren] = useState([]);
  const [terms, setTerms] = useState([]);
  const [feeItems, setFeeItems] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [enrollmentData, setEnrollmentData] = useState({
    student_id: '',
    term_id: '',
    selected_optional_items: [],
    installment_plan_id: '',
    total_amount: 0
  });
  const [existingEnrollments, setExistingEnrollments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, termsRes, feeItemsRes, plansRes] = await Promise.all([
        studentsAPI.getAll({ parent_id: user.id }),
        termsAPI.getAll(),
        feeItemsAPI.getAll(),
        financeAPI.getInstallmentPlans()
      ]);

      const allChildren = studentsRes.data.students || [];
      setChildren(allChildren);
      setTerms(termsRes.data.terms || []);
      setFeeItems(feeItemsRes.data.fee_items || []);
      setInstallmentPlans(plansRes.data.installment_plans || []);
      
      // Fetch existing enrollments (invoices) for all children
      const enrollments = [];
      for (const child of allChildren) {
        try {
          const invoicesRes = await axios.get(`${API_BASE_URL}/invoices.php?student_id=${child.id}`);
          const childInvoices = invoicesRes.data.invoices || [];
          childInvoices.forEach(inv => {
            enrollments.push({ student_id: child.id, term_id: inv.term_id });
          });
        } catch (err) {
          console.error('Error fetching invoices for child:', child.id, err);
        }
      }
      setExistingEnrollments(enrollments);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const mandatoryItems = feeItems.filter(item => item.is_optional == 0);
  const optionalItems = feeItems.filter(item => item.is_optional == 1);

  const calculateTotal = () => {
    let total = 0;
    
    // Add mandatory items
    mandatoryItems.forEach(item => {
      total += parseFloat(item.amount || 0);
    });

    // Add selected optional items
    enrollmentData.selected_optional_items.forEach(itemId => {
      const item = optionalItems.find(i => i.id === itemId);
      if (item) {
        total += parseFloat(item.amount || 0);
      }
    });

    return total;
  };

  const handleOptionalItemToggle = (itemId) => {
    setEnrollmentData(prev => ({
      ...prev,
      selected_optional_items: prev.selected_optional_items.includes(itemId)
        ? prev.selected_optional_items.filter(id => id !== itemId)
        : [...prev.selected_optional_items, itemId]
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Create invoice
      const invoiceData = {
        student_id: enrollmentData.student_id,
        parent_id: user.id,
        term_id: enrollmentData.term_id,
        class_id: 1, // Should get from student
        academic_year: '2024/2025',
        total_amount: calculateTotal(),
        installment_plan_id: enrollmentData.installment_plan_id,
        status: 'pending_finance',
        items: [
          ...mandatoryItems.map(item => ({
            fee_item_id: item.id,
            description: item.item_name,
            quantity: 1,
            unit_price: parseFloat(item.amount || 0),
            amount: parseFloat(item.amount || 0),
            is_optional: 0
          })),
          ...optionalItems
            .filter(item => enrollmentData.selected_optional_items.includes(item.id))
            .map(item => ({
              fee_item_id: item.id,
              description: item.item_name,
              quantity: 1,
              unit_price: parseFloat(item.amount || 0),
              amount: parseFloat(item.amount || 0),
              is_optional: 1
            }))
        ]
      };

      await financeAPI.createInvoice(invoiceData);
      
      alert('Enrollment submitted successfully! Your invoice has been sent for approval.');
      navigate('/parent/dashboard');
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      alert('Failed to submit enrollment');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = children.find(c => c.id == enrollmentData.student_id);
  const selectedTerm = terms.find(t => t.id == enrollmentData.term_id);
  const selectedPlan = installmentPlans.find(p => p.id == enrollmentData.installment_plan_id);
  
  // Filter children to exclude those already enrolled in the selected term
  const availableChildren = enrollmentData.term_id 
    ? children.filter(child => 
        !existingEnrollments.some(e => 
          e.student_id == child.id && e.term_id == enrollmentData.term_id
        )
      )
    : children;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Term Enrollment</h1>
        <p className="text-gray-600 mt-1">Enroll your child for the new term</p>
      </div>

      {/* Progress Steps */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-600">Select Term</span>
          <span className="text-xs text-gray-600">Select Child</span>
          <span className="text-xs text-gray-600">Optional Services</span>
          <span className="text-xs text-gray-600">Payment Plan</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Term</h2>
            <div className="space-y-3">
              {terms.map((term) => (
                <button
                  key={term.id}
                  onClick={() => setEnrollmentData({ ...enrollmentData, term_id: term.id, student_id: '' })}
                  className={`w-full p-4 border-2 rounded-lg text-left ${
                    enrollmentData.term_id == term.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{term.term_name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    {term.is_active == 1 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Child</h2>
            <p className="text-sm text-gray-500">Children already enrolled in the selected term are not shown.</p>
            {availableChildren.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No children available for enrollment</p>
                {children.length > 0 && (
                  <p className="text-sm text-blue-600 mt-2">All your children are already enrolled in the selected term.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {availableChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setEnrollmentData({ ...enrollmentData, student_id: child.id })}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      enrollmentData.student_id == child.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{child.first_name} {child.last_name}</p>
                        <p className="text-sm text-gray-600">{child.student_id} - {child.class_name}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Mandatory Fees</h2>
            <div className="space-y-2">
              {mandatoryItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">{item.item_name}</span>
                  <span className="font-semibold text-green-600">GHS {parseFloat(item.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <h2 className="text-lg font-semibold mt-6">Optional Services</h2>
            <div className="space-y-2">
              {optionalItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enrollmentData.selected_optional_items.includes(item.id)}
                      onChange={() => handleOptionalItemToggle(item.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{item.item_name}</span>
                  </div>
                  <span className="font-semibold text-blue-600">GHS {parseFloat(item.amount || 0).toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Payment Plan</h2>
            <div className="space-y-3">
              {installmentPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setEnrollmentData({ ...enrollmentData, installment_plan_id: plan.id })}
                  className={`w-full p-4 border-2 rounded-lg text-left ${
                    enrollmentData.installment_plan_id == plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{plan.plan_name}</p>
                    {plan.is_default == 1 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold mb-3">Enrollment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Student:</span>
                  <span className="font-medium">{selectedStudent?.first_name} {selectedStudent?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Term:</span>
                  <span className="font-medium">{selectedTerm?.term_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Plan:</span>
                  <span className="font-medium">{selectedPlan?.plan_name}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-lg text-blue-600">GHS {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="btn bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !enrollmentData.term_id) ||
                (step === 2 && !enrollmentData.student_id)
              }
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !enrollmentData.installment_plan_id}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'Submitting...' : 'Submit Enrollment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
