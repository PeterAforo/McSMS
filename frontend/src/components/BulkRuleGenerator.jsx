import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function BulkRuleGenerator({ feeItemId, classes, terms, levels, onSave, onCancel }) {
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [amounts, setAmounts] = useState({});
  const [applyToAllAmount, setApplyToAllAmount] = useState('');
  const [useSameAmount, setUseSameAmount] = useState(false);

  const toggleClass = (classId) => {
    setSelectedClasses(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const toggleTerm = (termId) => {
    setSelectedTerms(prev => 
      prev.includes(termId) ? prev.filter(id => id !== termId) : [...prev, termId]
    );
  };

  const selectAllClasses = () => {
    setSelectedClasses(classes.map(c => c.id));
  };

  const deselectAllClasses = () => {
    setSelectedClasses([]);
  };

  const selectAllTerms = () => {
    setSelectedTerms(terms.map(t => t.id));
  };

  const deselectAllTerms = () => {
    setSelectedTerms([]);
  };

  const handleAmountChange = (classId, termId, value) => {
    const key = `${classId}-${termId}`;
    setAmounts(prev => ({ ...prev, [key]: value }));
  };

  const applySameAmount = () => {
    if (!applyToAllAmount) return;
    
    selectedClasses.forEach(classId => {
      selectedTerms.forEach(termId => {
        const key = `${classId}-${termId}`;
        setAmounts(prev => ({ ...prev, [key]: applyToAllAmount }));
      });
    });
  };

  const generateRules = () => {
    const rules = [];
    
    selectedClasses.forEach(classId => {
      selectedTerms.forEach(termId => {
        const key = `${classId}-${termId}`;
        const amount = amounts[key] || applyToAllAmount;
        
        if (amount) {
          rules.push({
            fee_item_id: feeItemId,
            class_id: classId,
            term_id: termId,
            level: selectedLevel,
            amount: parseFloat(amount),
            currency: 'GHS',
            academic_year: '2024/2025',
            is_active: 1,
            late_fee: 0,
            late_fee_type: 'fixed',
            is_taxable: 0,
            tax_rate: 0
          });
        }
      });
    });
    
    onSave(rules);
  };

  const getClassById = (id) => classes.find(c => c.id === id);
  const getTermById = (id) => terms.find(t => t.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bulk Generate Rules</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Class Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Select Classes</label>
          <div className="flex gap-2">
            <button onClick={selectAllClasses} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
            <button onClick={deselectAllClasses} className="text-xs text-gray-600 hover:text-gray-800">Deselect All</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => toggleClass(cls.id)}
              className={`flex items-center gap-2 p-2 rounded text-sm border ${
                selectedClasses.includes(cls.id)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {selectedClasses.includes(cls.id) && <Check className="w-4 h-4" />}
              {cls.class_name}
            </button>
          ))}
        </div>
      </div>

      {/* Term Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Select Terms</label>
          <div className="flex gap-2">
            <button onClick={selectAllTerms} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
            <button onClick={deselectAllTerms} className="text-xs text-gray-600 hover:text-gray-800">Deselect All</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {terms.map(term => (
            <button
              key={term.id}
              onClick={() => toggleTerm(term.id)}
              className={`flex items-center gap-2 p-2 rounded text-sm border ${
                selectedTerms.includes(term.id)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {selectedTerms.includes(term.id) && <Check className="w-4 h-4" />}
              {term.name}
            </button>
          ))}
        </div>
      </div>

      {/* Level Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Education Level (Optional)</label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">All Levels</option>
          {levels.map(level => (
            <option key={level} value={level}>{level.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Amount Matrix */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <label className="block text-sm font-medium">Amounts</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useSameAmount"
              checked={useSameAmount}
              onChange={(e) => setUseSameAmount(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="useSameAmount" className="text-sm text-gray-600">Use same amount for all</label>
          </div>
        </div>

        {useSameAmount ? (
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter amount"
              value={applyToAllAmount}
              onChange={(e) => setApplyToAllAmount(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              onClick={applySameAmount}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Term</th>
                  <th className="px-3 py-2 text-left">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedClasses.length === 0 || selectedTerms.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-3 py-4 text-center text-gray-500">
                      Select classes and terms to see amount matrix
                    </td>
                  </tr>
                ) : (
                  selectedClasses.map(classId => 
                    selectedTerms.map(termId => {
                      const key = `${classId}-${termId}`;
                      return (
                        <tr key={key}>
                          <td className="px-3 py-2">{getClassById(classId)?.class_name}</td>
                          <td className="px-3 py-2">{getTermById(termId)?.name}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              placeholder="0.00"
                              value={amounts[key] || ''}
                              onChange={(e) => handleAmountChange(classId, termId, e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedClasses.length > 0 && selectedTerms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            Will generate <strong>{selectedClasses.length * selectedTerms.length}</strong> rules for{' '}
            <strong>{selectedClasses.length}</strong> classes and <strong>{selectedTerms.length}</strong> terms
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={generateRules}
          disabled={selectedClasses.length === 0 || selectedTerms.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Generate {selectedClasses.length * selectedTerms.length} Rules
        </button>
      </div>
    </div>
  );
}
