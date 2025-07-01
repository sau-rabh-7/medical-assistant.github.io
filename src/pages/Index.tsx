import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
// import { ApiSettings } from '@/components/ApiSettings'; // REMOVE THIS IMPORT
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
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
      content: "Hello! I'm your medical consultation assistant powered by AI. I can help you understand your symptoms and recommend which medical department you should consult. Describe your symptoms or upload an image if relevant. Remember, I'm here to guide you, but always consult with a healthcare professional for proper diagnosis.", // UPDATED WELCOME MESSAGE
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // const [showSettings, setShowSettings] = useState(false); // REMOVE THIS STATE
  const [isConfigured, setIsConfigured] = useState(true); // HARDCODE TO TRUE SINCE API KEY IS NOW IN AIService

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Remove the API key configuration check within generateResponse if it's always configured
  const generateResponse = async (userMessage: string, imageData?: string) => {
    // No need for isConfigured check here if it's always true and API key is hardcoded
    // if (!isConfigured) {
    //   toast({
    //     title: "API Not Configured",
    //     description: "Please configure your API key in settings first.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    setIsGenerating(true);
    setIsTyping(true);

    try {
      const response = await aiService.generateMedicalResponse(userMessage, imageData);
      
      let botResponseContent: string;

      if (typeof response === 'string') {
        botResponseContent = response;
      } else {
        const urgencyColors = {
          low: 'text-green-600',
          medium: 'text-yellow-600',
          high: 'text-orange-600',
          emergency: 'text-red-600'
        };

        botResponseContent = `**🏥 Recommended Department: ${response.department}**

**📋 Analysis:**
${response.reasoning}

**⚠️ Urgency Level:** <span class="${urgencyColors[response.urgency]}">${response.urgency.toUpperCase()}</span>

**📝 Next Steps:**
${response.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**⚖️ Important Disclaimer:**
${response.disclaimer}

${response.urgency === 'emergency' ? '🚨 **EMERGENCY**: If this is a medical emergency, please call emergency services immediately!' : ''}

Would you like me to help you with any other symptoms or questions?`;
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: botResponseContent,
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

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    let userMessage = '';
    let imageData: string | undefined;
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        userMessage = messages[i].content;
        imageData = messages[i].image;
        break;
      }
    }

    if (!userMessage) return;

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    await generateResponse(userMessage, imageData);
  };

  // REMOVE THIS FUNCTION:
  // const handleApiSettings = (provider: 'openai' | 'gemini', apiKey: string) => {
  //   aiService.setProvider(provider, apiKey);
  //   setIsConfigured(true);
  //   localStorage.setItem('ai_provider', provider);
  //   localStorage.setItem('ai_configured', 'true');
  // };

  useEffect(() => {
    // With the API key hardcoded in aiService.ts,
    // we can simplify this. The app is always 'configured'.
    // setIsConfigured(true); // Already initialized to true directly in useState

    // REMOVE localStorage handling for API configuration as it's no longer needed
    // const configured = localStorage.getItem('ai_configured');
    // const provider = localStorage.getItem('ai_provider');
    // if (configured === 'true' && provider) {
    //   setIsConfigured(true);
    // }
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

  const handleImageUpload = async (imageData: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        <ChatHeader 
          isConfigured={isConfigured}
          // Remove onSettingsClick prop:
          // onSettingsClick={() => setShowSettings(true)}
        />

        <div className="flex-1 bg-white/60 backdrop-blur-sm overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onRegenerate={message.type === 'bot' ? handleRegenerate : undefined}
                />
              ))}

              {isTyping && <TypingIndicator isGenerating={isGenerating} />}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          onImageUpload={handleImageUpload}
          isGenerating={isGenerating}
          isConfigured={isConfigured}
        />
      </div>

      {/* REMOVE THE APISETTINGS COMPONENT RENDER */}
      {/* <ApiSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleApiSettings}
      /> */}
    </div>
  );
};

export default Index;