import axios from 'axios';
import { API_BASE_URL } from '../config';
import { AIResponse, StudentAnalysis } from '../types';

const AI_API = `${API_BASE_URL}/ai.php`;

interface ChatContext {
  user_id?: number;
  user_type?: string;
}

interface ContentParams {
  subject?: string;
  topic?: string;
  grade?: string;
  score?: number;
  purpose?: string;
  description?: string;
}

interface ClassInsights {
  success: boolean;
  insights?: {
    subject_performance: Array<{
      subject: string;
      avg_score: number;
      student_count: number;
    }>;
    attendance_rate: number;
    student_count: number;
  };
  error?: string;
}

interface AIStatus {
  success: boolean;
  openai_configured: boolean;
  anthropic_configured: boolean;
  fallback_available: boolean;
}

/**
 * AI Service - Provides AI-powered features for the application
 */
export const aiService = {
  /**
   * Chat with AI assistant
   */
  async chat(
    message: string, 
    context: ChatContext = {}, 
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<AIResponse> {
    try {
      const response = await axios.post<AIResponse>(AI_API, {
        action: 'chat',
        message,
        user_id: context.user_id,
        user_type: context.user_type,
        provider
      });
      return response.data;
    } catch (error) {
      console.error('AI Chat error:', error);
      return {
        success: false,
        response: 'Sorry, I encountered an error. Please try again.',
        provider: 'error'
      };
    }
  },

  /**
   * Generate content (lesson plans, reports, announcements)
   */
  async generateContent(
    type: 'lesson_plan' | 'report_comment' | 'announcement' | 'email_template', 
    params: ContentParams
  ): Promise<AIResponse> {
    try {
      const response = await axios.post<AIResponse>(AI_API, {
        action: 'generate',
        type,
        params
      });
      return response.data;
    } catch (error) {
      console.error('AI Generate error:', error);
      return {
        success: false,
        response: '',
        provider: 'error'
      };
    }
  },

  /**
   * Generate a lesson plan
   */
  async generateLessonPlan(
    subject: string, 
    topic: string, 
    grade: string
  ): Promise<AIResponse> {
    return this.generateContent('lesson_plan', { subject, topic, grade });
  },

  /**
   * Generate a report comment for a student
   */
  async generateReportComment(score: number, subject: string): Promise<AIResponse> {
    return this.generateContent('report_comment', { score, subject });
  },

  /**
   * Generate a school announcement
   */
  async generateAnnouncement(topic: string): Promise<AIResponse> {
    return this.generateContent('announcement', { topic });
  },

  /**
   * Generate an email template
   */
  async generateEmailTemplate(purpose: string): Promise<AIResponse> {
    return this.generateContent('email_template', { purpose });
  },

  /**
   * Analyze student performance
   */
  async analyzeStudentPerformance(studentId: number): Promise<StudentAnalysis> {
    try {
      const response = await axios.post<StudentAnalysis>(AI_API, {
        action: 'analyze_student',
        student_id: studentId
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis error:', error);
      return {
        success: false,
        analysis: {
          average_score: 0,
          highest_score: 0,
          lowest_score: 0,
          total_subjects: 0,
          strengths: [],
          weaknesses: []
        },
        recommendations: []
      };
    }
  },

  /**
   * Get class insights
   */
  async getClassInsights(classId: number): Promise<ClassInsights> {
    try {
      const response = await axios.post<ClassInsights>(AI_API, {
        action: 'class_insights',
        class_id: classId
      });
      return response.data;
    } catch (error) {
      console.error('AI Insights error:', error);
      return {
        success: false,
        error: 'Failed to get class insights'
      };
    }
  },

  /**
   * Check AI service status
   */
  async checkStatus(): Promise<AIStatus> {
    try {
      const response = await axios.post<AIStatus>(AI_API, {
        action: 'status'
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        openai_configured: false,
        anthropic_configured: false,
        fallback_available: true
      };
    }
  }
};

export default aiService;
