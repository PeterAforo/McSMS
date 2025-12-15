import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Command, 
  Search, Home, Users, BookOpen, DollarSign, 
  Calendar, MessageSquare, Settings, HelpCircle,
  ChevronRight, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Voice Commands Component
 * Provides voice-controlled navigation and actions
 */
export default function VoiceCommands({ onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [matchedCommand, setMatchedCommand] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const userType = user?.user_type || 'admin';
  const basePath = `/${userType}`;

  // Voice command definitions
  const commands = [
    // Navigation commands
    { 
      patterns: ['go to dashboard', 'open dashboard', 'show dashboard', 'dashboard'],
      action: () => navigate(`${basePath}/dashboard`),
      response: 'Opening dashboard',
      icon: Home,
      category: 'Navigation'
    },
    { 
      patterns: ['go to students', 'show students', 'open students', 'students list'],
      action: () => navigate(`${basePath}/students`),
      response: 'Opening students',
      icon: Users,
      category: 'Navigation'
    },
    { 
      patterns: ['go to teachers', 'show teachers', 'open teachers', 'teachers list'],
      action: () => navigate(`${basePath}/teachers`),
      response: 'Opening teachers',
      icon: Users,
      category: 'Navigation'
    },
    { 
      patterns: ['go to classes', 'show classes', 'open classes', 'class list'],
      action: () => navigate(`${basePath}/classes`),
      response: 'Opening classes',
      icon: BookOpen,
      category: 'Navigation'
    },
    { 
      patterns: ['go to finance', 'show finance', 'open finance', 'payments', 'fees'],
      action: () => navigate(`${basePath}/finance`),
      response: 'Opening finance',
      icon: DollarSign,
      category: 'Navigation'
    },
    { 
      patterns: ['go to attendance', 'show attendance', 'open attendance', 'attendance'],
      action: () => navigate(`${basePath}/attendance`),
      response: 'Opening attendance',
      icon: Calendar,
      category: 'Navigation'
    },
    { 
      patterns: ['go to messages', 'show messages', 'open messages', 'inbox'],
      action: () => navigate(`${basePath}/messages`),
      response: 'Opening messages',
      icon: MessageSquare,
      category: 'Navigation'
    },
    { 
      patterns: ['go to settings', 'show settings', 'open settings', 'preferences'],
      action: () => navigate(`${basePath}/settings`),
      response: 'Opening settings',
      icon: Settings,
      category: 'Navigation'
    },
    { 
      patterns: ['go to help', 'show help', 'open help', 'help center', 'help me'],
      action: () => navigate(`${basePath}/help`),
      response: 'Opening help center',
      icon: HelpCircle,
      category: 'Navigation'
    },
    { 
      patterns: ['go to reports', 'show reports', 'open reports', 'analytics'],
      action: () => navigate(`${basePath}/reports`),
      response: 'Opening reports',
      icon: BookOpen,
      category: 'Navigation'
    },
    
    // Search commands
    { 
      patterns: ['search for *', 'find *', 'look for *'],
      action: (query) => {
        // Trigger search with the query
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.value = query;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.focus();
        }
      },
      response: (query) => `Searching for ${query}`,
      icon: Search,
      category: 'Search'
    },
    
    // Action commands
    { 
      patterns: ['log out', 'logout', 'sign out'],
      action: () => {
        if (confirm('Are you sure you want to log out?')) {
          navigate('/login');
        }
      },
      response: 'Logging out',
      icon: Command,
      category: 'Actions'
    },
    { 
      patterns: ['refresh', 'reload page', 'reload'],
      action: () => window.location.reload(),
      response: 'Refreshing page',
      icon: Command,
      category: 'Actions'
    },
    { 
      patterns: ['go back', 'back', 'previous page'],
      action: () => navigate(-1),
      response: 'Going back',
      icon: Command,
      category: 'Actions'
    },
    
    // Quick info commands
    { 
      patterns: ['what time is it', 'current time', 'time'],
      action: () => {},
      response: () => `The current time is ${new Date().toLocaleTimeString()}`,
      icon: Command,
      category: 'Info'
    },
    { 
      patterns: ['what day is it', 'today', 'date'],
      action: () => {},
      response: () => `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      icon: Command,
      category: 'Info'
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript.toLowerCase().trim();
        setTranscript(text);

        if (result.isFinal) {
          processCommand(text);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setFeedback('Error: ' + event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processCommand = useCallback((text) => {
    setIsProcessing(true);
    
    // Find matching command
    for (const command of commands) {
      for (const pattern of command.patterns) {
        // Check for wildcard patterns
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace('*', '(.+)') + '$', 'i');
          const match = text.match(regex);
          if (match) {
            const capturedText = match[1];
            setMatchedCommand(command);
            const response = typeof command.response === 'function' 
              ? command.response(capturedText) 
              : command.response;
            setFeedback(response);
            speak(response);
            setTimeout(() => {
              command.action(capturedText);
              setIsProcessing(false);
              if (onClose) setTimeout(onClose, 1000);
            }, 1000);
            return;
          }
        } else if (text.includes(pattern) || pattern.includes(text)) {
          setMatchedCommand(command);
          const response = typeof command.response === 'function' 
            ? command.response() 
            : command.response;
          setFeedback(response);
          speak(response);
          setTimeout(() => {
            command.action();
            setIsProcessing(false);
            if (onClose) setTimeout(onClose, 1000);
          }, 1000);
          return;
        }
      }
    }

    // No match found
    setFeedback("I didn't understand that command. Try saying 'go to dashboard' or 'show students'.");
    speak("I didn't understand that command.");
    setIsProcessing(false);
  }, [commands, navigate, onClose]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setFeedback('');
      setMatchedCommand(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Group commands by category
  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Command className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Voice Commands</h2>
                <p className="text-sm text-white/80">Speak to navigate or perform actions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Microphone Button */}
          <div className="flex flex-col items-center mb-6">
            <button
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : isListening ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You said:</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">"{transcript}"</p>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`mb-4 p-4 rounded-xl ${
              matchedCommand 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                {matchedCommand && <matchedCommand.icon className="w-5 h-5" />}
                <p className="font-medium">{feedback}</p>
              </div>
            </div>
          )}

          {/* Available Commands */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Available Commands
            </h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">{category}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {cmds.slice(0, 4).map((cmd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                      >
                        <cmd.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          "{cmd.patterns[0]}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            💡 Tip: Say "go to [page name]" to navigate, or "search for [query]" to search
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Voice Command Button - Floating button to trigger voice commands
 */
export function VoiceCommandButton() {
  const [showModal, setShowModal] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Keyboard shortcut (Ctrl+Shift+V)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        setShowModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isSupported) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-40 group"
        title="Voice Commands (Ctrl+Shift+V)"
      >
        <Mic className="w-5 h-5" />
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Voice Commands
        </span>
      </button>

      {showModal && <VoiceCommands onClose={() => setShowModal(false)} />}
    </>
  );
}
