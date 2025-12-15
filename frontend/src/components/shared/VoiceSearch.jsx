import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';

export default function VoiceSearch({ onResult, onClose, isOpen }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);
        
        if (result.isFinal) {
          onResult(text);
          setIsListening(false);
        }
      };

      recognitionInstance.onerror = (event) => {
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognition) {
      setTranscript('');
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Voice Search</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isListening ? 'Listening...' : 'Click the microphone to start'}
          </p>
        </div>

        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${
            isListening 
              ? 'bg-red-500 animate-pulse scale-110' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105'
          }`}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        {isListening && (
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-600 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 30}px`,
                  animationDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>
        )}

        {transcript && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4">
            <p className="text-gray-800 dark:text-gray-200 text-lg">"{transcript}"</p>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Try saying:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Search students', 'Show Class 6A', 'Find John Mensah', 'Open attendance'].map((example, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                "{example}"
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Voice Search Button Component
export function VoiceSearchButton({ onResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  if (!isSupported) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Voice Search"
      >
        <Mic className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
      
      <VoiceSearch
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onResult={(text) => {
          onResult(text);
          setIsOpen(false);
        }}
      />
    </>
  );
}
