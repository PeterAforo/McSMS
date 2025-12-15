import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Bot, User, Loader2, 
  Minimize2, Maximize2, Volume2, VolumeX, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

// FAQ Knowledge Base
const FAQ_DATABASE = {
  // Fee related
  'fee': {
    keywords: ['fee', 'fees', 'payment', 'pay', 'cost', 'tuition', 'amount', 'how much'],
    responses: [
      "To view your fees, go to the Finance section in your dashboard.",
      "You can pay fees online through Mobile Money (MTN, Vodafone, AirtelTigo) or card payment.",
      "For fee inquiries, please contact the accounts office or check your invoice in the Payments section."
    ]
  },
  'payment': {
    keywords: ['payment', 'pay', 'mobile money', 'momo', 'card', 'bank'],
    responses: [
      "We accept multiple payment methods: Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), Visa/Mastercard, and Bank Transfer.",
      "To make a payment: Go to Payments → Select Invoice → Choose Payment Method → Complete Payment.",
      "Payment receipts are automatically sent to your email and available in the Payments section."
    ]
  },
  
  // Attendance
  'attendance': {
    keywords: ['attendance', 'absent', 'present', 'late', 'missed', 'class'],
    responses: [
      "You can view your child's attendance record in the Dashboard or Child Details section.",
      "If your child is absent, please inform the school through the Messages section or call the office.",
      "Attendance is marked daily by class teachers. You'll receive notifications for any absences."
    ]
  },
  
  // Results/Grades
  'results': {
    keywords: ['result', 'results', 'grade', 'grades', 'score', 'marks', 'exam', 'report'],
    responses: [
      "View your child's results in the 'Results' section of the Parent Portal.",
      "Report cards are published at the end of each term. You'll receive a notification when they're ready.",
      "For grade inquiries, please message the subject teacher through the Messages section."
    ]
  },
  
  // Homework
  'homework': {
    keywords: ['homework', 'assignment', 'assignments', 'task', 'project'],
    responses: [
      "Check the Homework section to see all pending and completed assignments.",
      "Homework is assigned by teachers with due dates. You'll receive notifications for new assignments.",
      "If you have questions about homework, message the teacher directly through the app."
    ]
  },
  
  // Timetable
  'timetable': {
    keywords: ['timetable', 'schedule', 'class time', 'period', 'when'],
    responses: [
      "The class timetable is available in the Timetable section of the dashboard.",
      "Timetables show daily class schedules including subjects, teachers, and room numbers.",
      "Any changes to the timetable will be notified through the app."
    ]
  },
  
  // Transport
  'transport': {
    keywords: ['bus', 'transport', 'pick up', 'drop', 'route', 'driver'],
    responses: [
      "Track your child's school bus in real-time through the Transport section.",
      "Bus routes and schedules are available in the Transport module.",
      "For transport issues, contact the transport coordinator through Messages."
    ]
  },
  
  // Communication
  'message': {
    keywords: ['message', 'contact', 'teacher', 'communicate', 'talk', 'reach'],
    responses: [
      "Use the Messages section to communicate with teachers and school administration.",
      "You can send messages to any teacher or the admin office directly from the app.",
      "All messages are saved in your inbox for future reference."
    ]
  },
  
  // Admission
  'admission': {
    keywords: ['admission', 'enroll', 'enrolment', 'register', 'new student', 'apply'],
    responses: [
      "To apply for admission, go to 'Apply for Admission' in the Parent Portal.",
      "Required documents: Birth certificate, previous school records, passport photos.",
      "Admission applications are reviewed within 5-7 working days."
    ]
  },
  
  // General
  'help': {
    keywords: ['help', 'support', 'assist', 'how to', 'guide'],
    responses: [
      "I'm here to help! You can ask me about fees, attendance, results, homework, timetable, transport, or messaging.",
      "For technical issues, please contact support@school.com or call the IT helpdesk.",
      "Use the search bar at the top to quickly find any feature in the app."
    ]
  },
  
  'greeting': {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    responses: [
      "Hello! 👋 I'm your school assistant. How can I help you today?",
      "Hi there! I can help you with fees, attendance, results, homework, and more. What do you need?",
      "Welcome! Ask me anything about the school management system."
    ]
  },
  
  'thanks': {
    keywords: ['thank', 'thanks', 'thank you', 'appreciate'],
    responses: [
      "You're welcome! Is there anything else I can help you with?",
      "Happy to help! Feel free to ask if you have more questions.",
      "Anytime! Don't hesitate to reach out if you need more assistance."
    ]
  }
};

export default function AIChatbot() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI assistant. How can I help you today?`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Check each category
    for (const [category, data] of Object.entries(FAQ_DATABASE)) {
      for (const keyword of data.keywords) {
        if (lowerQuery.includes(keyword)) {
          // Return random response from category
          const responses = data.responses;
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
    
    // Default response
    return "I'm not sure about that. You can ask me about:\n• Fees & Payments\n• Attendance\n• Results & Grades\n• Homework\n• Timetable\n• Transport\n• Messaging\n\nOr contact the school office for specific inquiries.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Try API first, fallback to local FAQ
    let response;
    try {
      const apiResponse = await axios.post(`${API_BASE_URL}/chatbot.php`, {
        query: input,
        user_id: user?.id,
        user_type: user?.user_type
      });
      response = apiResponse.data.response;
    } catch (e) {
      response = findResponse(input);
    }

    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: response,
      time: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const quickActions = [
    { label: 'Check Fees', query: 'How do I check my fees?' },
    { label: 'View Results', query: 'Where can I see my results?' },
    { label: 'Homework', query: 'Show me pending homework' },
    { label: 'Contact Teacher', query: 'How do I message a teacher?' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50 group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center animate-pulse">
          <Sparkles className="w-3 h-3" />
        </span>
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI Assistant
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${isMinimized ? 'w-72' : 'w-96'} transition-all duration-300`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Assistant</h3>
              <p className="text-white/70 text-xs">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}>
                      {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      <div className={`flex items-center gap-2 mt-1 ${msg.type === 'user' ? 'justify-end' : ''}`}>
                        <span className={`text-xs ${msg.type === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.type === 'bot' && (
                          <button
                            onClick={() => speakMessage(msg.text)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {isSpeaking ? <VolumeX className="w-3 h-3 text-gray-400" /> : <Volume2 className="w-3 h-3 text-gray-400" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(action.query);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
