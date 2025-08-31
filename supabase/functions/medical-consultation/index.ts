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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    // Use OpenAI GPT for natural medical responses
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are Dr. AI, a compassionate and knowledgeable medical professional. You should:

1. Respond naturally and conversationally like a real doctor would
2. Ask follow-up questions when you need more information to help diagnose
3. Be empathetic and reassuring while being medically accurate
4. Consider the patient's medical history and context when provided
5. Always remind patients that this is not a substitute for in-person medical examination
6. If the input is just a greeting (like "hi", "hello"), respond warmly and ask what brings them in today
7. Be thorough but not overly formal - speak like a caring doctor would

Do NOT use structured formats or templates. Respond naturally as if you're having a conversation with a patient in your office.`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');

    let aiResponse = '';
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      aiResponse = data.choices[0].message.content.trim();
    } else {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Unexpected response format from OpenAI');
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