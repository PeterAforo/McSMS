import { describe, it, expect } from 'vitest';

// Test utility functions
describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (amount, currency = 'GHS') => {
      return new Intl.NumberFormat('en-GH', { 
        style: 'currency', 
        currency 
      }).format(amount || 0);
    };

    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1000)).toContain('1,000');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toContain('0');
    });

    it('handles null/undefined', () => {
      expect(formatCurrency(null)).toContain('0');
      expect(formatCurrency(undefined)).toContain('0');
    });

    it('formats decimal numbers', () => {
      expect(formatCurrency(1234.56)).toContain('1,234.56');
    });
  });

  describe('formatDate', () => {
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    it('formats date string correctly', () => {
      expect(formatDate('2026-02-24')).toBe('Feb 24, 2026');
    });

    it('handles empty string', () => {
      expect(formatDate('')).toBe('');
    });

    it('handles null', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('validateEmail', () => {
    const validateEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('calculateGrade', () => {
    const calculateGrade = (score) => {
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      if (score >= 60) return 'C';
      if (score >= 50) return 'D';
      return 'F';
    };

    it('returns A for scores >= 80', () => {
      expect(calculateGrade(80)).toBe('A');
      expect(calculateGrade(100)).toBe('A');
      expect(calculateGrade(95)).toBe('A');
    });

    it('returns B for scores 70-79', () => {
      expect(calculateGrade(70)).toBe('B');
      expect(calculateGrade(79)).toBe('B');
    });

    it('returns C for scores 60-69', () => {
      expect(calculateGrade(60)).toBe('C');
      expect(calculateGrade(69)).toBe('C');
    });

    it('returns D for scores 50-59', () => {
      expect(calculateGrade(50)).toBe('D');
      expect(calculateGrade(59)).toBe('D');
    });

    it('returns F for scores below 50', () => {
      expect(calculateGrade(49)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });
  });

  describe('calculateAttendanceRate', () => {
    const calculateAttendanceRate = (present, total) => {
      if (total === 0) return 0;
      return Math.round((present / total) * 100);
    };

    it('calculates correct percentage', () => {
      expect(calculateAttendanceRate(18, 20)).toBe(90);
      expect(calculateAttendanceRate(20, 20)).toBe(100);
      expect(calculateAttendanceRate(15, 20)).toBe(75);
    });

    it('handles zero total', () => {
      expect(calculateAttendanceRate(0, 0)).toBe(0);
    });

    it('handles zero present', () => {
      expect(calculateAttendanceRate(0, 20)).toBe(0);
    });
  });
});
