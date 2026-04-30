import { useState, useEffect, useRef } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function SmartInput({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  suggestionType = 'item_name',
  placeholder = '',
  required = false 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/finance.php?resource=suggestions&type=${suggestionType}&query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="w-full border rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {value && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto"
        >
          <div className="p-2 bg-gray-50 border-b flex items-center gap-2 text-xs text-gray-600">
            <Lightbulb className="w-3 h-3" />
            <span>Suggestions based on industry standards</span>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"
            >
              <span className="text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {loading && showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
          Loading suggestions...
        </div>
      )}
    </div>
  );
}
