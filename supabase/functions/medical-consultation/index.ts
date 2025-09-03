import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { pipeline } from 'https://esm.sh/@huggingface/transformers@3.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the text generation pipeline once
let textGenerator: any = null;

const initializeModel = async () => {
  if (!textGenerator) {
    console.log('Initializing text generation model...');
    try {
      textGenerator = await pipeline(
        'text-generation',
        'onnx-community/gpt2-medium',
        { device: 'cpu' }
      );
      console.log('Model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize model:', error);
      throw error;
    }
  }
  return textGenerator;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, patientContext, imageData } = await req.json();
    
    console.log('Received request:', { symptoms, patientContext: !!patientContext, hasImage: !!imageData });

    // Initialize the model
    const generator = await initializeModel();

    // Create a comprehensive prompt for medical consultation
    let prompt = `Medical Assistant: Hello! I'm here to help with your health concerns.

Patient: ${symptoms}

Medical Assistant:`;

    if (patientContext) {
      prompt = `Medical Assistant: Hello! I see you're ${patientContext.name || 'here for a consultation'}. I'm here to help with your health concerns.

Patient Information:
- Age: ${patientContext.age || 'Not provided'}
- Medical History: ${patientContext.medical_history || 'None provided'}
- Current Medications: ${patientContext.current_medications || 'None provided'}
- Allergies: ${patientContext.allergies || 'None provided'}

Patient: ${symptoms}

Medical Assistant:`;
    }

    console.log('Generating response for prompt:', prompt);

    // Generate response using the local model
    const result = await generator(prompt, {
      max_new_tokens: 200,
      temperature: 0.7,
      do_sample: true,
      return_full_text: false,
      pad_token_id: 50256 // GPT-2 pad token
    });

    let aiResponse;
    if (Array.isArray(result) && result[0]?.generated_text) {
      aiResponse = result[0].generated_text.trim();
    } else if (result?.generated_text) {
      aiResponse = result.generated_text.trim();
    } else {
      console.error('Unexpected response format from model:', result);
      aiResponse = "Hello! I'm here to help you with your health concerns. Could you please tell me more about what you're experiencing so I can provide you with appropriate guidance?";
    }

    // Clean up the response
    aiResponse = aiResponse.replace(/^Medical Assistant:\s*/i, '').trim();
    
    // Ensure we have a meaningful response
    if (!aiResponse || aiResponse.length < 10) {
      aiResponse = "Hello! I'm here to help you with your health concerns. Could you please tell me more about what you're experiencing so I can provide you with appropriate guidance?";
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medical-consultation function:', error);
    
    const fallbackResponse = "Hello! I'm a medical assistant here to help you. Please tell me about your symptoms or health concerns, and I'll do my best to provide guidance. Remember, for urgent medical issues, please contact your healthcare provider or emergency services directly.";
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse 
    }), {
      status: 200, // Return 200 with fallback response instead of error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});