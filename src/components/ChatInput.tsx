
import { useRef } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onImageUpload: (imageData: string) => void;
  isGenerating: boolean;
  isConfigured: boolean;
}

export const ChatInput = ({ 
  inputValue, 
  setInputValue, 
  onSendMessage, 
  onImageUpload, 
  isGenerating, 
  isConfigured 
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      onImageUpload(imageData);
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4 rounded-b-lg mb-4">
      <div className="flex gap-3 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 h-10 w-10"
          disabled={isGenerating || !isConfigured}
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConfigured ? "Describe your symptoms or upload an image..." : "Configure API key in settings first..."}
            className="pr-12 min-h-[40px] resize-none"
            disabled={isGenerating || !isConfigured}
          />
        </div>

        <Button 
          onClick={onSendMessage}
          disabled={!inputValue.trim() || isGenerating || !isConfigured}
          size="icon"
          className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        This AI assistant provides general guidance only. Always consult healthcare professionals for medical advice.
      </p>
    </div>
  );
};