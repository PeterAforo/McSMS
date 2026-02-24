import axios from 'axios';
import { API_BASE_URL } from '../config';
import { VideoMeeting, MeetingParticipant } from '../types';

const VIDEO_API = `${API_BASE_URL}/video_conferencing.php`;

interface MeetingResponse {
  success: boolean;
  meeting?: VideoMeeting;
  error?: string;
}

interface MeetingsListResponse {
  success: boolean;
  meetings: VideoMeeting[];
  total?: number;
}

interface JoinResponse {
  success: boolean;
  meeting_url?: string;
  token?: string;
  error?: string;
}

interface CreateMeetingParams {
  title: string;
  host_id: number;
  start_time: string;
  duration: number;
  provider: 'zoom' | 'google_meet' | 'teams';
  participants?: number[];
  description?: string;
  class_id?: number;
}

/**
 * Video Conferencing Service - Handles Zoom, Google Meet, and Teams integration
 */
export const videoService = {
  /**
   * Get all meetings
   */
  async getMeetings(filters?: {
    status?: string;
    host_id?: number;
    from_date?: string;
    to_date?: string;
  }): Promise<MeetingsListResponse> {
    try {
      const params = new URLSearchParams({ action: 'meetings' });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.host_id) params.append('host_id', String(filters.host_id));
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);

      const response = await axios.get(`${VIDEO_API}?${params.toString()}`);
      return { success: true, meetings: response.data.meetings || [] };
    } catch (error) {
      console.error('Get meetings error:', error);
      return { success: false, meetings: [] };
    }
  },

  /**
   * Get a single meeting by ID
   */
  async getMeeting(meetingId: number): Promise<MeetingResponse> {
    try {
      const response = await axios.get(`${VIDEO_API}?action=meetings&id=${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Get meeting error:', error);
      return { success: false, error: 'Failed to get meeting' };
    }
  },

  /**
   * Create a new meeting
   */
  async createMeeting(params: CreateMeetingParams): Promise<MeetingResponse> {
    try {
      const response = await axios.post(`${VIDEO_API}?action=create_meeting`, params);
      return response.data;
    } catch (error) {
      console.error('Create meeting error:', error);
      return { success: false, error: 'Failed to create meeting' };
    }
  },

  /**
   * Join a meeting
   */
  async joinMeeting(meetingId: number, userId: number): Promise<JoinResponse> {
    try {
      const response = await axios.get(
        `${VIDEO_API}?action=join_meeting&meeting_id=${meetingId}&user_id=${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Join meeting error:', error);
      return { success: false, error: 'Failed to join meeting' };
    }
  },

  /**
   * End a meeting
   */
  async endMeeting(meetingId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${VIDEO_API}?action=end_meeting`, {
        meeting_id: meetingId
      });
      return response.data;
    } catch (error) {
      console.error('End meeting error:', error);
      return { success: false, error: 'Failed to end meeting' };
    }
  },

  /**
   * Get meeting participants
   */
  async getParticipants(meetingId: number): Promise<{
    success: boolean;
    participants: MeetingParticipant[];
  }> {
    try {
      const response = await axios.get(
        `${VIDEO_API}?action=participants&meeting_id=${meetingId}`
      );
      return { success: true, participants: response.data.participants || [] };
    } catch (error) {
      console.error('Get participants error:', error);
      return { success: false, participants: [] };
    }
  },

  /**
   * Create a virtual classroom
   */
  async createClassroom(params: {
    name: string;
    class_id: number;
    teacher_id: number;
    subject_id?: number;
    schedule?: {
      day: number;
      start_time: string;
      end_time: string;
    }[];
  }): Promise<{ success: boolean; classroom_id?: number; error?: string }> {
    try {
      const response = await axios.post(`${VIDEO_API}?action=create_classroom`, params);
      return response.data;
    } catch (error) {
      console.error('Create classroom error:', error);
      return { success: false, error: 'Failed to create virtual classroom' };
    }
  },

  /**
   * Get virtual classrooms
   */
  async getClassrooms(teacherId?: number): Promise<{
    success: boolean;
    classrooms: Array<{
      id: number;
      name: string;
      class_name: string;
      teacher_name: string;
      student_count: number;
      next_session?: string;
    }>;
  }> {
    try {
      const url = teacherId
        ? `${VIDEO_API}?action=classrooms&teacher_id=${teacherId}`
        : `${VIDEO_API}?action=classrooms`;
      const response = await axios.get(url);
      return { success: true, classrooms: response.data.classrooms || [] };
    } catch (error) {
      console.error('Get classrooms error:', error);
      return { success: false, classrooms: [] };
    }
  },

  /**
   * Start a live class session
   */
  async startLiveClass(classroomId: number, hostId: number): Promise<JoinResponse> {
    try {
      const response = await axios.post(`${VIDEO_API}?action=start_live_class`, {
        classroom_id: classroomId,
        host_id: hostId
      });
      return response.data;
    } catch (error) {
      console.error('Start live class error:', error);
      return { success: false, error: 'Failed to start live class' };
    }
  },

  /**
   * Record a meeting
   */
  async startRecording(meetingId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.post(`${VIDEO_API}?action=start_recording`, {
        meeting_id: meetingId
      });
      return response.data;
    } catch (error) {
      console.error('Start recording error:', error);
      return { success: false, error: 'Failed to start recording' };
    }
  },

  /**
   * Get meeting recordings
   */
  async getRecordings(meetingId?: number): Promise<{
    success: boolean;
    recordings: Array<{
      id: number;
      meeting_id: number;
      title: string;
      duration: number;
      url: string;
      created_at: string;
    }>;
  }> {
    try {
      const url = meetingId
        ? `${VIDEO_API}?action=recordings&meeting_id=${meetingId}`
        : `${VIDEO_API}?action=recordings`;
      const response = await axios.get(url);
      return { success: true, recordings: response.data.recordings || [] };
    } catch (error) {
      console.error('Get recordings error:', error);
      return { success: false, recordings: [] };
    }
  },

  /**
   * Check provider configuration status
   */
  async checkProviderStatus(): Promise<{
    zoom: boolean;
    google_meet: boolean;
    teams: boolean;
  }> {
    try {
      const response = await axios.get(`${VIDEO_API}?action=provider_status`);
      return response.data;
    } catch (error) {
      return { zoom: false, google_meet: false, teams: false };
    }
  }
};

export default videoService;
