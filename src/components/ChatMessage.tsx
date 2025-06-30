
import { Bot, User, RefreshCcw, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  image?: string;
}

interface ChatMessageProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
}

export const ChatMessage = ({ message, onRegenerate }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message.id);
    }
  };

  return (
    <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'bot' && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className="flex flex-col gap-2 max-w-[80%]">
        <Card className={`p-4 ${
          message.type === 'user' 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
            : 'bg-white border border-gray-200'
        }`}>
          {message.image && (
            <div className="mb-3">
              <img 
                src={message.image} 
                alt="Uploaded symptom" 
                className="max-w-full h-auto rounded-lg max-h-48 object-cover"
              />
            </div>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          <div className={`text-xs mt-2 opacity-70 ${
            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </Card>

        {message.type === 'bot' && (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <RefreshCcw className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {message.type === 'user' && (
        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};
