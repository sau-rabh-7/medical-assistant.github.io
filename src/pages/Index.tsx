import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Bot, User, Loader2, Image as ImageIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ApiSettings } from '@/components/ApiSettings';
import { aiService } from '@/services/aiService';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  image?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your medical consultation assistant powered by AI. I can help you understand your symptoms and recommend which medical department you should consult. Please configure your API key in settings first, then describe your symptoms or upload an image if relevant. Remember, I'm here to guide you, but always consult with a healthcare professional for proper diagnosis.",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = async (userMessage: string, imageData?: string) => {
    if (!isConfigured) {
      toast({
        title: "API Not Configured",
        description: "Please configure your API key in settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsTyping(true);

    try {
      const response = await aiService.generateMedicalResponse(userMessage, imageData);
      
      const urgencyColors = {
        low: 'text-green-600',
        medium: 'text-yellow-600',
        high: 'text-orange-600',
        emergency: 'text-red-600'
      };

      const botResponse = `**🏥 Recommended Department: ${response.department}**

**📋 Analysis:**
${response.reasoning}

**⚠️ Urgency Level:** <span class="${urgencyColors[response.urgency]}">${response.urgency.toUpperCase()}</span>

**📝 Next Steps:**
${response.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**⚖️ Important Disclaimer:**
${response.disclaimer}

${response.urgency === 'emergency' ? '🚨 **EMERGENCY**: If this is a medical emergency, please call emergency services immediately!' : ''}

Would you like me to help you with any other symptoms or questions?`;

      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI Response Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

  const handleApiSettings = (provider: 'openai' | 'gemini', apiKey: string) => {
    aiService.setProvider(provider, apiKey);
    setIsConfigured(true);
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_configured', 'true');
  };

  // Check if API is already configured on mount
  useEffect(() => {
    const configured = localStorage.getItem('ai_configured');
    if (configured === 'true') {
      setIsConfigured(true);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToProcess = inputValue;
    setInputValue('');

    await generateResponse(messageToProcess);
  };

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
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: "I've uploaded an image for analysis.",
        timestamp: new Date(),
        image: imageData,
      };

      setMessages(prev => [...prev, userMessage]);
      await generateResponse("Image uploaded for symptom analysis", imageData);
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
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
              onClick={() => setShowSettings(true)}
              className="h-10 w-10"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white/60 backdrop-blur-sm overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <Card className={`max-w-[80%] p-4 ${
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

                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
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
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
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
              onClick={handleSendMessage}
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
      </div>

      <ApiSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleApiSettings}
      />
    </div>
  );
};

export default Index;
