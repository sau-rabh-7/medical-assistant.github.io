import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'doctor';
  content: string;
  timestamp: Date;
  image_url?: string;
}

interface Patient {
  id: string;
  name: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  recent_operations?: string;
}

const ChatPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const { user, loading } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!sessionId || !patientId) {
      navigate('/');
      return;
    }

    fetchPatientAndMessages();
  }, [user, loading, sessionId, patientId, navigate]);

  const fetchPatientAndMessages = async () => {
    if (!user || !sessionId || !patientId) return;

    // Fetch patient details
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (patientError || !patientData) {
      toast({
        title: "Error",
        description: "Failed to load patient information",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    setPatient(patientData);

    // Fetch messages for this chat session
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } else {
      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        type: msg.type as 'user' | 'doctor',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        image_url: msg.image_url || undefined
      }));
      setMessages(formattedMessages);
    }

    // Add welcome message if no messages exist
    if (!messagesData || messagesData.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'doctor',
        content: `Hello! I'm Dr. AI, and I'll be assisting with ${patientData.name}'s consultation today. I have access to their medical profile and am ready to help with any symptoms or health concerns. Please describe what's troubling ${patientData.name} today.`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  const generateResponse = async (userMessage: string, imageData?: string) => {
    if (!patient || !sessionId) return;

    setIsTyping(true);
    setIsGenerating(true);

    try {
      // Call the edge function with patient context
      const { data, error } = await supabase.functions.invoke('medical-consultation', {
        body: {
          symptoms: userMessage,
          patientContext: patient,
          imageData
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'doctor',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      // Save the message to database
      await supabase
        .from('messages')
        .insert({
          chat_session_id: sessionId,
          type: 'doctor',
          content: data.response
        });

    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    await supabase
      .from('messages')
      .insert({
        chat_session_id: sessionId,
        type: 'user',
        content: inputValue
      });

    const messageToProcess = inputValue;
    setInputValue('');

    await generateResponse(messageToProcess);
  };

  const handleImageUpload = async (imageData: string) => {
    if (!sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: "I've uploaded an image for analysis.",
      timestamp: new Date(),
      image_url: imageData,
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message with image to database
    await supabase
      .from('messages')
      .insert({
        chat_session_id: sessionId,
        type: 'user',
        content: "I've uploaded an image for analysis.",
        image_url: imageData
      });

    await generateResponse("Please analyze this medical image", imageData);
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    let userMessage = '';
    let imageData: string | undefined;
    
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        userMessage = messages[i].content;
        imageData = messages[i].image_url;
        break;
      }
    }

    if (!userMessage) return;

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    await generateResponse(userMessage, imageData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm p-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">
              Consultation with {patient?.name || 'Patient'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Dr. AI Medical Assistant
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={{
                ...message,
                type: message.type === 'doctor' ? 'bot' : message.type,
                image: message.image_url
              }}
              onRegenerate={message.type === 'doctor' ? handleRegenerate : undefined}
            />
          ))}
          
          {isTyping && <TypingIndicator isGenerating={isGenerating} />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            onImageUpload={handleImageUpload}
            isGenerating={isGenerating}
            isConfigured={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;