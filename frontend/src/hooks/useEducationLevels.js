import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Custom hook to fetch education levels from the API
 * Replaces hardcoded levels like ['creche', 'nursery', 'kg', 'primary', 'jhs', 'shs']
 */
export function useEducationLevels(activeOnly = true) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLevels();
  }, [activeOnly]);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/education_levels.php`, {
        params: { active_only: activeOnly }
      });
      setLevels(response.data.levels || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching education levels:', err);
      // Fallback to default levels if API fails
      setLevels([
        { id: 1, level_code: 'creche', level_name: 'Creche', display_order: 1 },
        { id: 2, level_code: 'nursery', level_name: 'Nursery', display_order: 2 },
        { id: 3, level_code: 'kg', level_name: 'Kindergarten', display_order: 3 },
        { id: 4, level_code: 'primary', level_name: 'Primary', display_order: 4 },
        { id: 5, level_code: 'jhs', level_name: 'Junior High School', display_order: 5 },
        { id: 6, level_code: 'shs', level_name: 'Senior High School', display_order: 6 }
      ]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get level codes array (for backward compatibility)
  const levelCodes = levels.map(l => l.level_code);

  // Helper to get level name by code
  const getLevelName = (code) => {
    const level = levels.find(l => l.level_code === code);
    return level ? level.level_name : code?.toUpperCase() || '';
  };

  // Helper for select options
  const levelOptions = levels.map(l => ({
    value: l.level_code,
    label: l.level_name
  }));

  return {
    levels,
    levelCodes,
    levelOptions,
    getLevelName,
    loading,
    error,
    refetch: fetchLevels
  };
}

export default useEducationLevels;
