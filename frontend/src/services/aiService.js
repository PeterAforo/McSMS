import axios from 'axios';
import { API_BASE_URL } from '../config';

const AI_API = `${API_BASE_URL}/ai.php`;

/**
 * AI Service - Provides AI-powered features for the application
 */
export const aiService = {
  /**
   * Chat with AI assistant
   * @param {string} message - User message
   * @param {object} context - User context (user_type, user_id)
   * @param {string} provider - AI provider ('openai' or 'anthropic')
   */
  async chat(message, context = {}, provider = 'openai') {
    try {
      const response = await axios.post(AI_API, {
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
   * @param {string} type - Content type ('lesson_plan', 'report_comment', 'announcement', 'email_template')
   * @param {object} params - Parameters for content generation
   */
  async generateContent(type, params) {
    try {
      const response = await axios.post(AI_API, {
        action: 'generate',
        type,
        params
      });
      return response.data;
    } catch (error) {
      console.error('AI Generate error:', error);
      return {
        success: false,
        error: 'Failed to generate content'
      };
    }
  },

  /**
   * Generate a lesson plan
   * @param {string} subject - Subject name
   * @param {string} topic - Lesson topic
   * @param {string} grade - Grade level
   */
  async generateLessonPlan(subject, topic, grade) {
    return this.generateContent('lesson_plan', { subject, topic, grade });
  },

  /**
   * Generate a report comment for a student
   * @param {number} score - Student's score
   * @param {string} subject - Subject name
   */
  async generateReportComment(score, subject) {
    return this.generateContent('report_comment', { score, subject });
  },

  /**
   * Generate a school announcement
   * @param {string} topic - Announcement topic/description
   */
  async generateAnnouncement(topic) {
    return this.generateContent('announcement', { topic });
  },

  /**
   * Generate an email template
   * @param {string} purpose - Email purpose
   */
  async generateEmailTemplate(purpose) {
    return this.generateContent('email_template', { purpose });
  },

  /**
   * Analyze student performance
   * @param {number} studentId - Student ID
   */
  async analyzeStudentPerformance(studentId) {
    try {
      const response = await axios.post(AI_API, {
        action: 'analyze_student',
        student_id: studentId
      });
      return response.data;
    } catch (error) {
      console.error('AI Analysis error:', error);
      return {
        success: false,
        error: 'Failed to analyze student performance'
      };
    }
  },

  /**
   * Get class insights
   * @param {number} classId - Class ID
   */
  async getClassInsights(classId) {
    try {
      const response = await axios.post(AI_API, {
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
  async checkStatus() {
    try {
      const response = await axios.post(AI_API, {
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
