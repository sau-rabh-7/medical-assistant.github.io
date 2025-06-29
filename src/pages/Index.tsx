
import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Bot, User, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

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
      content: "Hello! I'm your medical consultation assistant. I can help you understand your symptoms and recommend which medical department you should consult. Please describe your symptoms or upload an image if relevant. Remember, I'm here to guide you, but always consult with a healthcare professional for proper diagnosis.",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
    setIsGenerating(true);
    setIsTyping(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

      // Mock AI response - in a real app, this would call OpenAI/Gemini API
      const responses = [
        {
          symptoms: ['headache', 'fever', 'fatigue'],
          department: 'Internal Medicine',
          reasoning: 'Based on your symptoms of headache, fever, and fatigue, I recommend consulting with Internal Medicine first. These symptoms could indicate various conditions including viral infections, stress, or other systemic issues.'
        },
        {
          symptoms: ['chest pain', 'shortness of breath'],
          department: 'Cardiology',
          reasoning: 'Your symptoms of chest pain and shortness of breath warrant immediate attention from a Cardiologist. These could be signs of heart-related conditions that require specialized care.'
        },
        {
          symptoms: ['skin rash', 'itching', 'redness'],
          department: 'Dermatology',
          reasoning: 'For skin-related symptoms like rash, itching, and redness, I recommend consulting with a Dermatologist who specializes in skin conditions and can provide appropriate treatment.'
        },
        {
          symptoms: ['joint pain', 'stiffness', 'swelling'],
          department: 'Rheumatology',
          reasoning: 'Joint pain, stiffness, and swelling are typically best evaluated by a Rheumatologist who specializes in conditions affecting joints, muscles, and bones.'
        }
      ];

      // Simple keyword matching for demo purposes
      const lowerMessage = userMessage.toLowerCase();
      let selectedResponse = responses[0]; // default

      if (lowerMessage.includes('chest') || lowerMessage.includes('heart') || lowerMessage.includes('breath')) {
        selectedResponse = responses[1];
      } else if (lowerMessage.includes('skin') || lowerMessage.includes('rash') || lowerMessage.includes('itch')) {
        selectedResponse = responses[2];
      } else if (lowerMessage.includes('joint') || lowerMessage.includes('pain') && lowerMessage.includes('stiff')) {
        selectedResponse = responses[3];
      }

      const botResponse = `**Recommended Department: ${selectedResponse.department}**

${selectedResponse.reasoning}

**Next Steps:**
1. Schedule an appointment with ${selectedResponse.department}
2. Prepare a list of all your symptoms and when they started
3. Bring any relevant medical history or medications you're taking

**Important:** This is a preliminary recommendation. If you're experiencing severe symptoms or this is an emergency, please seek immediate medical attention or call emergency services.

Would you like me to help you with any other symptoms or questions?`;

      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Medical Consultation Assistant</h1>
              <p className="text-sm text-gray-600">Get personalized department recommendations</p>
            </div>
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
                        {isGenerating ? 'Analyzing symptoms...' : 'Typing...'}
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
              disabled={isGenerating}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>

            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your symptoms or upload an image..."
                className="pr-12 min-h-[40px] resize-none"
                disabled={isGenerating}
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating}
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
    </div>
  );
};

export default Index;
