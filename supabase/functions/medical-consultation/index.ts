import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, patientContext, imageData } = await req.json();
    
    console.log('Received request:', { symptoms, patientContext: !!patientContext, hasImage: !!imageData });

    // Create a natural, conversational prompt for the AI
    let prompt = symptoms;
    
    // Add patient context if available
    if (patientContext) {
      prompt = `Patient Information:
- Name: ${patientContext.name}
- Age: ${patientContext.age || 'Not specified'}
- Sex: ${patientContext.sex || 'Not specified'}
- Blood Group: ${patientContext.blood_group || 'Not specified'}
- Medical History: ${patientContext.medical_history || 'None provided'}
- Allergies: ${patientContext.allergies || 'None provided'}
- Current Medications: ${patientContext.current_medications || 'None provided'}
- Recent Operations: ${patientContext.recent_operations || 'None provided'}

Patient says: ${symptoms}`;
    }

    const huggingfaceApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
    
    if (!huggingfaceApiKey) {
      console.error('HUGGINGFACE_API_KEY not found in environment variables');
      throw new Error('Hugging Face API key not configured');
    }

    // Use Hugging Face's free medical model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/BioGPT-Large",
      {
        headers: {
          "Authorization": `Bearer ${huggingfaceApiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: `You are Dr. AI, a medical professional. Respond naturally to patients. If someone says "hi" or similar greetings, respond warmly and ask what brings them in today.

${prompt}

Response:`,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          },
          options: {
            wait_for_model: true
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Hugging Face API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Hugging Face response received successfully');

    let aiResponse = '';
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      aiResponse = data[0].generated_text.trim();
      
      // Clean up the response if it contains the prompt
      if (aiResponse.includes('Response:')) {
        aiResponse = aiResponse.split('Response:')[1]?.trim() || aiResponse;
      }
    } else {
      console.error('Unexpected Hugging Face response format:', data);
      
      // Provide a natural fallback response based on the input
      if (symptoms.toLowerCase().includes('hi') || symptoms.toLowerCase().includes('hello')) {
        aiResponse = `Hello! Welcome to our medical consultation. I'm Dr. AI, and I'm here to help you today. What brings you in? Please describe any symptoms or health concerns you'd like to discuss.`;
      } else {
        aiResponse = `Thank you for sharing that with me. To provide you with the best possible guidance, could you tell me more about what you're experiencing? When did these symptoms start, and how severe would you rate them on a scale of 1-10?

Please remember that while I can provide general medical guidance, this consultation doesn't replace an in-person examination with a healthcare provider. For serious or emergency symptoms, please seek immediate medical attention.`;
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medical-consultation function:', error);
    
    // Simple fallback that lets the user know there's an issue
    const fallbackResponse = `I apologize, but I'm having some technical difficulties right now. Could you please try again in a moment? If this continues, please contact your healthcare provider directly for any urgent medical concerns.`;
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse 
    }), {
      status: 200, // Return 200 so the client gets the fallback message
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});