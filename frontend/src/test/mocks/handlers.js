/**
 * Mock API handlers for testing
 */

export const mockUsers = [
  { id: 1, name: 'Admin User', email: 'admin@school.com', user_type: 'admin', status: 'active' },
  { id: 2, name: 'Teacher User', email: 'teacher@school.com', user_type: 'teacher', status: 'active' },
  { id: 3, name: 'Parent User', email: 'parent@school.com', user_type: 'parent', status: 'active' },
  { id: 4, name: 'Student User', email: 'student@school.com', user_type: 'student', status: 'active' },
];

export const mockStudents = [
  { id: 1, first_name: 'John', last_name: 'Doe', class_id: 1, class_name: 'Grade 1', status: 'active' },
  { id: 2, first_name: 'Jane', last_name: 'Smith', class_id: 1, class_name: 'Grade 1', status: 'active' },
];

export const mockClasses = [
  { id: 1, class_name: 'Grade 1', level: 'PRIMARY', capacity: 30 },
  { id: 2, class_name: 'Grade 2', level: 'PRIMARY', capacity: 30 },
];

export const mockGrades = [
  { id: 1, student_id: 1, subject_id: 1, score: 85, grade: 'A', term_id: 1 },
  { id: 2, student_id: 2, subject_id: 1, score: 78, grade: 'B', term_id: 1 },
];

export const mockAttendance = [
  { id: 1, student_id: 1, date: '2026-02-24', status: 'present', class_id: 1 },
  { id: 2, student_id: 2, date: '2026-02-24', status: 'present', class_id: 1 },
];

export const mockLoginResponse = {
  success: true,
  user: mockUsers[0],
  token: 'mock-jwt-token-12345',
};

export const mockErrorResponse = {
  success: false,
  error: 'Invalid credentials',
};
