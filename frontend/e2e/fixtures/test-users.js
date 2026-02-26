// Test user credentials for E2E testing
// These should match users in your test database

export const testUsers = {
  admin: {
    email: 'admin@school.com',
    password: 'admin123',
    role: 'admin',
    dashboardPath: '/admin',
  },
  teacher: {
    email: 'teacher@school.com',
    password: 'teacher123',
    role: 'teacher',
    dashboardPath: '/teacher',
  },
  parent: {
    email: 'parent@school.com',
    password: 'parent123',
    role: 'parent',
    dashboardPath: '/parent',
  },
  student: {
    email: 'student@school.com',
    password: 'student123',
    role: 'student',
    dashboardPath: '/student',
  },
  principal: {
    email: 'principal@school.com',
    password: 'principal123',
    role: 'principal',
    dashboardPath: '/principal',
  },
  hr: {
    email: 'hr@school.com',
    password: 'hr123',
    role: 'hr',
    dashboardPath: '/hr',
  },
  finance: {
    email: 'finance@school.com',
    password: 'finance123',
    role: 'finance',
    dashboardPath: '/finance',
  },
};

export const invalidUser = {
  email: 'invalid@test.com',
  password: 'wrongpassword',
};
