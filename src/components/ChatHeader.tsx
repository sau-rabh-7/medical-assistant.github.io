
import { Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  isConfigured: boolean;
  onSettingsClick: () => void;
}

export const ChatHeader = ({ isConfigured, onSettingsClick }: ChatHeaderProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 rounded-t-lg mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Medical Consultation Assistant</h1>
            <p className="text-sm text-gray-600">
              AI-powered department recommendations {!isConfigured && '(API key required)'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onSettingsClick}
          className="h-10 w-10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
