/**
 * Core TypeScript type definitions for McSMS
 */

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  user_type: 'admin' | 'teacher' | 'parent' | 'student' | 'principal' | 'hr' | 'finance';
  role_id?: number;
  status: 'active' | 'inactive' | 'suspended';
  profile_picture?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

// Student types
export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: number;
  class_name?: string;
  date_of_birth?: string;
  gender: 'male' | 'female' | 'other';
  parent_id?: number;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  photo?: string;
  address?: string;
  created_at?: string;
}

// Class types
export interface Class {
  id: number;
  class_name: string;
  level: 'NURSERY' | 'PRIMARY' | 'JHS' | 'SHS';
  capacity: number;
  teacher_id?: number;
  teacher_name?: string;
  student_count?: number;
}

// Subject types
export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  class_id?: number;
  teacher_id?: number;
}

// Grade types
export interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  term_id: number;
  score: number;
  grade: string;
  remarks?: string;
  created_at?: string;
}

// Attendance types
export interface Attendance {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

// Message types
export interface Message {
  id: number;
  sender_id: number;
  sender_name?: string;
  sender_type?: string;
  recipient_id: number;
  recipient_name?: string;
  subject: string;
  body: string;
  is_read: boolean;
  parent_id?: number;
  thread_id?: number;
  created_at: string;
  read_at?: string;
}

// Payment types
export interface Payment {
  id: number;
  student_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description?: string;
}

// Invoice types
export interface Invoice {
  id: number;
  student_id: number;
  student_name?: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  items?: InvoiceItem[];
  created_at?: string;
}

export interface InvoiceItem {
  id: number;
  description: string;
  amount: number;
  quantity: number;
}

// Event types
export interface Event {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_type: 'academic' | 'sports' | 'cultural' | 'meeting' | 'holiday';
  created_by?: number;
}

// Homework types
export interface Homework {
  id: number;
  title: string;
  description: string;
  subject_id: number;
  subject_name?: string;
  class_id: number;
  teacher_id: number;
  due_date: string;
  status: 'pending' | 'submitted' | 'graded';
  attachments?: string[];
}

// Timetable types
export interface TimetableEntry {
  id: number;
  class_id: number;
  subject_id: number;
  subject_name?: string;
  teacher_id: number;
  teacher_name?: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  end_time: string;
  room?: string;
}

// Transport types
export interface Bus {
  id: number;
  bus_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  route?: string;
  status: 'active' | 'maintenance' | 'inactive';
  current_location?: {
    lat: number;
    lng: number;
  };
}

// Notification types
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
  link?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  attendance_rate: number;
  fee_collection: number;
  pending_fees: number;
}

// AI types
export interface AIMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  time: Date;
}

export interface AIResponse {
  success: boolean;
  response: string;
  provider: 'openai' | 'anthropic' | 'local' | 'error';
}

export interface StudentAnalysis {
  success: boolean;
  analysis: {
    average_score: number;
    highest_score: number;
    lowest_score: number;
    total_subjects: number;
    strengths: string[];
    weaknesses: string[];
  };
  recommendations: string[];
}

// Biometric types
export interface BiometricDevice {
  id: string;
  name: string;
  type: 'fingerprint' | 'face' | 'iris';
  status: 'connected' | 'disconnected' | 'error';
  last_sync?: string;
}

export interface BiometricRecord {
  id: number;
  user_id: number;
  device_id: string;
  template_data: string;
  created_at: string;
}

// Video Conference types
export interface VideoMeeting {
  id: number;
  title: string;
  host_id: number;
  host_name?: string;
  start_time: string;
  duration: number;
  meeting_url: string;
  provider: 'zoom' | 'google_meet' | 'teams';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants?: number[];
}

export interface MeetingParticipant {
  user_id: number;
  name: string;
  email: string;
  role: 'host' | 'co-host' | 'participant';
  joined_at?: string;
}
