import { useState } from 'react';
import { 
  FileText, Plus, Edit, Trash2, Copy, Check, Search,
  MessageSquare, Phone, Mail, X, Save, Tag
} from 'lucide-react';

// Pre-built message templates
export const DEFAULT_TEMPLATES = {
  sms: [
    {
      id: 'sms-1',
      name: 'Fee Reminder',
      category: 'Finance',
      message: 'Dear Parent, this is a reminder that school fees of GHS {amount} for {student_name} is due on {due_date}. Please make payment to avoid late fees. Thank you.',
      variables: ['amount', 'student_name', 'due_date']
    },
    {
      id: 'sms-2',
      name: 'Absence Notification',
      category: 'Attendance',
      message: 'Dear Parent, {student_name} was marked absent today ({date}). Please contact the school if this was unexpected. Thank you.',
      variables: ['student_name', 'date']
    },
    {
      id: 'sms-3',
      name: 'Exam Reminder',
      category: 'Academic',
      message: 'Reminder: {exam_name} for {class_name} is scheduled for {date} at {time}. Please ensure {student_name} is prepared. Good luck!',
      variables: ['exam_name', 'class_name', 'date', 'time', 'student_name']
    },
    {
      id: 'sms-4',
      name: 'Event Invitation',
      category: 'Events',
      message: 'You are invited to {event_name} on {date} at {time}. Venue: {venue}. We look forward to seeing you!',
      variables: ['event_name', 'date', 'time', 'venue']
    },
    {
      id: 'sms-5',
      name: 'Payment Confirmation',
      category: 'Finance',
      message: 'Payment of GHS {amount} received for {student_name}. Receipt No: {receipt_no}. Balance: GHS {balance}. Thank you!',
      variables: ['amount', 'student_name', 'receipt_no', 'balance']
    },
    {
      id: 'sms-6',
      name: 'School Closure',
      category: 'Announcements',
      message: 'Important: School will be closed on {date} due to {reason}. Classes resume on {resume_date}. Stay safe!',
      variables: ['date', 'reason', 'resume_date']
    },
    {
      id: 'sms-7',
      name: 'Report Card Ready',
      category: 'Academic',
      message: 'Dear Parent, {student_name}\'s report card for {term} is now available. Please log in to the parent portal or visit the school to collect. Thank you.',
      variables: ['student_name', 'term']
    },
    {
      id: 'sms-8',
      name: 'Bus Delay',
      category: 'Transport',
      message: 'Notice: School bus {bus_number} is delayed by approximately {delay_time} minutes due to {reason}. We apologize for any inconvenience.',
      variables: ['bus_number', 'delay_time', 'reason']
    }
  ],
  whatsapp: [
    {
      id: 'wa-1',
      name: 'Welcome Message',
      category: 'Onboarding',
      message: `🎓 *Welcome to {school_name}!*

Dear {parent_name},

We are delighted to welcome {student_name} to our school family!

📚 *Class:* {class_name}
👨‍🏫 *Class Teacher:* {teacher_name}
📅 *Start Date:* {start_date}

Please download our parent app for updates and communication.

Best regards,
{school_name} Admin`,
      variables: ['school_name', 'parent_name', 'student_name', 'class_name', 'teacher_name', 'start_date']
    },
    {
      id: 'wa-2',
      name: 'Fee Invoice',
      category: 'Finance',
      message: `📋 *Fee Invoice*

Dear {parent_name},

Invoice for {student_name} - {term}

💰 *Amount Due:* GHS {amount}
📅 *Due Date:* {due_date}

*Payment Methods:*
• Mobile Money: {momo_number}
• Bank: {bank_details}

Reference: {invoice_number}

Thank you!`,
      variables: ['parent_name', 'student_name', 'term', 'amount', 'due_date', 'momo_number', 'bank_details', 'invoice_number']
    },
    {
      id: 'wa-3',
      name: 'Homework Assignment',
      category: 'Academic',
      message: `📝 *New Homework Assignment*

Subject: {subject}
Class: {class_name}

*Assignment:* {title}

{description}

📅 *Due Date:* {due_date}
📎 *Attachments:* {attachments}

Please ensure timely submission.

- {teacher_name}`,
      variables: ['subject', 'class_name', 'title', 'description', 'due_date', 'attachments', 'teacher_name']
    },
    {
      id: 'wa-4',
      name: 'Exam Results',
      category: 'Academic',
      message: `📊 *Exam Results*

Dear {parent_name},

{student_name}'s results for {exam_name}:

📈 *Score:* {score}/{total}
🏆 *Grade:* {grade}
📍 *Position:* {position}/{class_size}

*Teacher's Remarks:*
{remarks}

View detailed report on the parent portal.`,
      variables: ['parent_name', 'student_name', 'exam_name', 'score', 'total', 'grade', 'position', 'class_size', 'remarks']
    },
    {
      id: 'wa-5',
      name: 'Parent Meeting',
      category: 'Events',
      message: `📅 *Parent-Teacher Meeting*

Dear {parent_name},

You are invited to a meeting to discuss {student_name}'s progress.

📆 *Date:* {date}
⏰ *Time:* {time}
📍 *Venue:* {venue}

*Agenda:*
{agenda}

Please confirm your attendance by replying to this message.

Thank you!`,
      variables: ['parent_name', 'student_name', 'date', 'time', 'venue', 'agenda']
    },
    {
      id: 'wa-6',
      name: 'Daily Attendance',
      category: 'Attendance',
      message: `✅ *Daily Attendance Update*

Date: {date}

{student_name} was marked *{status}* today.

{status === 'Present' ? '🟢' : status === 'Late' ? '🟡' : '🔴'} Status: {status}
⏰ Time: {time}

Have a great day!`,
      variables: ['date', 'student_name', 'status', 'time']
    }
  ],
  email: [
    {
      id: 'email-1',
      name: 'Newsletter',
      category: 'Announcements',
      subject: '{school_name} Newsletter - {month} {year}',
      message: `Dear Parents and Guardians,

Welcome to our monthly newsletter!

{content}

Upcoming Events:
{events}

Important Dates:
{dates}

Best regards,
{school_name} Administration`,
      variables: ['school_name', 'month', 'year', 'content', 'events', 'dates']
    },
    {
      id: 'email-2',
      name: 'Academic Report',
      category: 'Academic',
      subject: 'Academic Report - {student_name} - {term}',
      message: `Dear {parent_name},

Please find attached the academic report for {student_name} for {term}.

Summary:
- Overall Grade: {overall_grade}
- Class Position: {position}
- Attendance: {attendance_rate}%

Teacher's Comments:
{comments}

Please review the attached detailed report and contact us if you have any questions.

Best regards,
{teacher_name}
Class Teacher`,
      variables: ['parent_name', 'student_name', 'term', 'overall_grade', 'position', 'attendance_rate', 'comments', 'teacher_name']
    }
  ]
};

// Template Manager Component
export default function MessageTemplates({ type = 'sms', onSelect, onClose }) {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES[type] || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const categories = ['all', ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (template) => {
    navigator.clipboard.writeText(template.message);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (template) => {
    onSelect?.(template);
    onClose?.();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Message Templates
            </h2>
            <p className="text-sm text-gray-500">
              {type === 'sms' ? 'SMS' : type === 'whatsapp' ? 'WhatsApp' : 'Email'} Templates
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b dark:border-gray-700 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="p-4 overflow-y-auto max-h-[50vh]">
        <div className="grid gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="border dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    <Tag className="w-3 h-3" />
                    {template.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(template)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copiedId === template.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSelect(template)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {template.message.length > 200 
                  ? template.message.substring(0, 200) + '...' 
                  : template.message}
              </div>
              
              {template.variables?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500">Variables:</span>
                  {template.variables.map(v => (
                    <span key={v} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No templates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Template Selector Button
export function TemplateSelector({ type, onSelect, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}
      >
        <FileText className="w-4 h-4" />
        Templates
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <MessageTemplates
            type={type}
            onSelect={onSelect}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}

// Variable Replacer Utility
export function replaceVariables(template, data) {
  let message = template;
  for (const [key, value] of Object.entries(data)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return message;
}
