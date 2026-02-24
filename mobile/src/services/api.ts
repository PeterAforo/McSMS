import axios from 'axios';

const API_BASE_URL = 'https://eea.mcaforo.com/backend/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth.php?action=login', { email, password });
      return response.data;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async logout() {
    try {
      const response = await api.post('/auth.php?action=logout');
      return response.data;
    } catch (error) {
      return { success: false };
    }
  },
};

export const studentService = {
  async getStudents(parentId?: number) {
    try {
      const url = parentId ? `/students.php?parent_id=${parentId}` : '/students.php';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return { success: false, students: [] };
    }
  },

  async getAttendance(studentId: number) {
    try {
      const response = await api.get(`/attendance.php?student_id=${studentId}`);
      return response.data;
    } catch (error) {
      return { success: false, attendance: [] };
    }
  },

  async getGrades(studentId: number) {
    try {
      const response = await api.get(`/grades.php?student_id=${studentId}`);
      return response.data;
    } catch (error) {
      return { success: false, grades: [] };
    }
  },
};

export const messageService = {
  async getMessages(userId: number) {
    try {
      const response = await api.get(`/messages.php?user_id=${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, messages: [] };
    }
  },

  async sendMessage(data: { sender_id: number; recipient_id: number; subject: string; body: string }) {
    try {
      const response = await api.post('/messages.php', data);
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to send message' };
    }
  },
};

export const notificationService = {
  async getNotifications(userId: number) {
    try {
      const response = await api.get(`/notifications.php?user_id=${userId}`);
      return response.data;
    } catch (error) {
      return { success: false, notifications: [] };
    }
  },

  async markAsRead(notificationId: number) {
    try {
      const response = await api.put(`/notifications.php?id=${notificationId}`, { is_read: true });
      return response.data;
    } catch (error) {
      return { success: false };
    }
  },
};

export default api;
