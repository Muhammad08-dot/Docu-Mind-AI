import { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface SmartSuggestionsProps {
  lastQuery: string;
  lastAnswer: string;
  onSuggestionClick: (suggestion: string) => void;
}

// Simulated AI-generated follow-up suggestions
const generateSuggestions = (query: string, _answer: string): string[] => {
  const suggestions: string[] = [];
  
  // Based on common patterns
  if (query.toLowerCase().includes('policy') || query.toLowerCase().includes('leave')) {
    suggestions.push(
      'What are the exceptions to this policy?',
      'How do I apply for this benefit?',
      'What documentation is required?',
      'Who should I contact for approval?'
    );
  } else if (query.toLowerCase().includes('transformer') || query.toLowerCase().includes('attention')) {
    suggestions.push(
      'How does multi-head attention improve performance?',
      'What are the computational requirements?',
      'Compare this with LSTM architecture',
      'What are the limitations of this approach?'
    );
  } else if (/[\u0600-\u06FF]/.test(query)) {
    // Urdu query
    suggestions.push(
      'اس پالیسی میں کیا استثناء ہیں؟',
      'درخواست کا طریقہ کار کیا ہے؟',
      'مزید تفصیلات فراہم کریں',
      'متعلقہ دستاویزات کون سی ہیں؟'
    );
  } else {
    suggestions.push(
      'Can you elaborate on this further?',
      'What are the key takeaways?',
      'Are there any related topics I should explore?',
      'Provide examples if available'
    );
  }
  
  return suggestions.slice(0, 4);
};

export default function SmartSuggestions({
  lastQuery,
  lastAnswer,
  onSuggestionClick,
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastQuery && lastAnswer) {
      setIsLoading(true);
      setIsVisible(false);
      
      // Simulate AI generating suggestions
      const timer = setTimeout(() => {
        setSuggestions(generateSuggestions(lastQuery, lastAnswer));
        setIsLoading(false);
        setIsVisible(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [lastQuery, lastAnswer]);

  if (!lastQuery || !lastAnswer) return null;

  return (
    <div className={cn(
      'transition-all duration-500',
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xs font-medium text-dark-400">Suggested follow-ups</span>
        <Sparkles className="w-3 h-3 text-amber-400" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-dark-500">
          <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          Generating suggestions...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface-card hover:border-amber-500/30 hover:bg-amber-500/5 text-left transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5 text-dark-500 group-hover:text-amber-400 flex-shrink-0" />
              <span className="text-xs text-dark-300 group-hover:text-white line-clamp-2 flex-1">
                {suggestion}
              </span>
              <ArrowRight className="w-3 h-3 text-dark-600 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
