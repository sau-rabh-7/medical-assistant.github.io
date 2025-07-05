
import { Bot, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TypingIndicatorProps {
  isGenerating: boolean;
}

export const TypingIndicator = ({ isGenerating }: TypingIndicatorProps) => {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <Card className="max-w-[80%] p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">
            {isGenerating ? 'Analyzing symptoms with AI...' : 'Typing...'}
          </span>
        </div>
      </Card>
    </div>
  );
};