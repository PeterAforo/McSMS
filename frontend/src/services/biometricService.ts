import axios from 'axios';
import { API_BASE_URL } from '../config';
import { BiometricDevice, BiometricRecord } from '../types';

const BIOMETRIC_API = `${API_BASE_URL}/biometric.php`;

interface DeviceStatus {
  success: boolean;
  device?: BiometricDevice;
  error?: string;
}

interface EnrollmentResult {
  success: boolean;
  record_id?: number;
  message?: string;
  error?: string;
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  user_id?: number;
  confidence?: number;
  error?: string;
}

interface AttendanceResult {
  success: boolean;
  attendance_id?: number;
  student_name?: string;
  time?: string;
  error?: string;
}

/**
 * Biometric Service - Handles fingerprint, face recognition, and RFID operations
 */
export const biometricService = {
  /**
   * Get all registered biometric devices
   */
  async getDevices(): Promise<{ success: boolean; devices: BiometricDevice[] }> {
    try {
      const response = await axios.get(`${BIOMETRIC_API}?resource=devices`);
      return { success: true, devices: response.data.devices || [] };
    } catch (error) {
      console.error('Get devices error:', error);
      return { success: false, devices: [] };
    }
  },

  /**
   * Register a new biometric device
   */
  async registerDevice(device: Partial<BiometricDevice>): Promise<DeviceStatus> {
    try {
      const response = await axios.post(`${BIOMETRIC_API}?resource=devices`, device);
      return response.data;
    } catch (error) {
      console.error('Register device error:', error);
      return { success: false, error: 'Failed to register device' };
    }
  },

  /**
   * Check device health/status
   */
  async checkDeviceHealth(deviceId: string): Promise<DeviceStatus> {
    try {
      const response = await axios.get(
        `${BIOMETRIC_API}?resource=devices&action=health&device_id=${deviceId}`
      );
      return response.data;
    } catch (error) {
      console.error('Device health check error:', error);
      return { success: false, error: 'Failed to check device health' };
    }
  },

  /**
   * Enroll user biometric data (fingerprint/face)
   */
  async enrollUser(
    userId: number,
    deviceId: string,
    biometricType: 'fingerprint' | 'face' | 'iris',
    templateData: string
  ): Promise<EnrollmentResult> {
    try {
      const response = await axios.post(`${BIOMETRIC_API}?resource=enrollment`, {
        user_id: userId,
        device_id: deviceId,
        biometric_type: biometricType,
        template_data: templateData
      });
      return response.data;
    } catch (error) {
      console.error('Enrollment error:', error);
      return { success: false, error: 'Failed to enroll biometric data' };
    }
  },

  /**
   * Verify user biometric data
   */
  async verifyUser(
    deviceId: string,
    templateData: string
  ): Promise<VerificationResult> {
    try {
      const response = await axios.post(`${BIOMETRIC_API}?resource=verification`, {
        device_id: deviceId,
        template_data: templateData
      });
      return response.data;
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, verified: false, error: 'Verification failed' };
    }
  },

  /**
   * Mark attendance using biometric
   */
  async markAttendance(
    studentId: number,
    deviceId: string,
    templateData: string
  ): Promise<AttendanceResult> {
    try {
      const response = await axios.post(`${BIOMETRIC_API}?resource=attendance`, {
        student_id: studentId,
        device_id: deviceId,
        template_data: templateData,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Attendance marking error:', error);
      return { success: false, error: 'Failed to mark attendance' };
    }
  },

  /**
   * Get enrollment records for a user
   */
  async getUserEnrollments(userId: number): Promise<{ success: boolean; records: BiometricRecord[] }> {
    try {
      const response = await axios.get(
        `${BIOMETRIC_API}?resource=enrollment&user_id=${userId}`
      );
      return { success: true, records: response.data.records || [] };
    } catch (error) {
      console.error('Get enrollments error:', error);
      return { success: false, records: [] };
    }
  },

  /**
   * Delete biometric enrollment
   */
  async deleteEnrollment(recordId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.delete(
        `${BIOMETRIC_API}?resource=enrollment&id=${recordId}`
      );
      return response.data;
    } catch (error) {
      console.error('Delete enrollment error:', error);
      return { success: false, error: 'Failed to delete enrollment' };
    }
  },

  /**
   * Sync offline attendance records
   */
  async syncOfflineRecords(records: Array<{
    student_id: number;
    timestamp: string;
    device_id: string;
  }>): Promise<{ success: boolean; synced: number; failed: number }> {
    try {
      const response = await axios.post(`${BIOMETRIC_API}?resource=sync`, {
        records
      });
      return response.data;
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, synced: 0, failed: records.length };
    }
  }
};

export default biometricService;
