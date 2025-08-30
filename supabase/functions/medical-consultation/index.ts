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

    // Build the medical consultation prompt
    let prompt = `You are Dr. AI, a compassionate and knowledgeable medical professional. Please provide a thoughtful medical consultation based on the following information:

**Patient Context:**
${patientContext ? `
- Name: ${patientContext.name}
- Age: ${patientContext.age || 'Not specified'}
- Sex: ${patientContext.sex || 'Not specified'}
- Blood Group: ${patientContext.blood_group || 'Not specified'}
- Medical History: ${patientContext.medical_history || 'None provided'}
- Known Allergies: ${patientContext.allergies || 'None provided'}
- Current Medications: ${patientContext.current_medications || 'None provided'}
- Recent Operations: ${patientContext.recent_operations || 'None provided'}
` : 'No patient context available'}

**Current Symptoms/Concern:**
${symptoms}

Please provide a comprehensive response that includes:
1. **Assessment**: Your professional interpretation of the symptoms
2. **Possible Conditions**: What conditions might explain these symptoms (from most to least likely)
3. **Immediate Recommendations**: What the patient should do right now
4. **When to Seek Care**: Guidelines for when to seek emergency, urgent, or routine care
5. **General Advice**: Lifestyle recommendations and monitoring suggestions

**Important Notes:**
- Always acknowledge the limitations of remote consultation
- Recommend in-person evaluation when appropriate
- Consider the patient's medical history and current medications in your assessment
- Provide clear, easy-to-understand explanations
- Be empathetic and reassuring while being medically accurate

Please respond in a warm, professional manner as you would during an in-person consultation.`;

    // Use OpenAI GPT for better medical responses
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are Dr. AI, a compassionate and knowledgeable medical professional. Provide thoughtful medical consultations while emphasizing the importance of in-person medical care for proper diagnosis.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      
      // Fallback response if API fails
      const fallbackResponse = `I understand you're experiencing: ${symptoms}

As a medical AI assistant, I want to help you understand your symptoms and guide you toward appropriate care.

**My Assessment:**
Based on what you've described, these symptoms could have several possible explanations. ${patientContext ? `Given your medical history and current medications, ` : ''}I recommend we consider both common and more serious possibilities.

**Immediate Recommendations:**
1. Monitor your symptoms closely
2. Stay hydrated and get adequate rest
3. Take note of any changes or worsening symptoms
4. Consider your pain level and overall well-being

**When to Seek Care:**
- **Seek emergency care immediately** if you experience severe pain, difficulty breathing, chest pain, or any symptoms that feel life-threatening
- **Contact your doctor today** if symptoms are moderate and concerning
- **Schedule a routine appointment** if symptoms are mild but persistent

**Important Reminder:**
While I can provide general guidance, this virtual consultation cannot replace a proper in-person medical examination. Please consider seeing a healthcare provider who can perform a physical examination and order appropriate tests if needed.

Is there anything specific about your symptoms you'd like me to explain further?`;

      return new Response(JSON.stringify({ response: fallbackResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    let aiResponse = '';
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      aiResponse = data.choices[0].message.content;
    } else {
      // Enhanced fallback with patient context
      aiResponse = `Thank you for sharing your symptoms with me. I understand you're experiencing: ${symptoms}

${patientContext ? `Based on your medical profile:
- I see you're ${patientContext.age ? `${patientContext.age} years old` : 'an adult patient'}
- ${patientContext.medical_history ? `Your medical history includes: ${patientContext.medical_history}` : 'No significant medical history noted'}
- ${patientContext.current_medications ? `You're currently taking: ${patientContext.current_medications}` : 'No current medications listed'}
- ${patientContext.allergies ? `I note your allergies to: ${patientContext.allergies}` : 'No known allergies on file'}

` : ''}**My Clinical Assessment:**
Your symptoms warrant careful evaluation. While I can provide guidance, a proper medical assessment requires physical examination and possibly diagnostic tests.

**Possible Considerations:**
The symptoms you're describing could be related to various conditions. Without being able to examine you directly, I'd recommend considering both common causes and ruling out more serious possibilities.

**My Recommendations:**
1. **Immediate care**: Monitor symptoms closely and note any changes
2. **Symptom tracking**: Keep a record of when symptoms occur and their severity
3. **Lifestyle measures**: Ensure adequate rest, hydration, and nutrition
4. **Medical evaluation**: I strongly recommend scheduling an appointment with your healthcare provider

**When to Seek Urgent Care:**
Please seek immediate medical attention if you experience:
- Severe or worsening symptoms
- Difficulty breathing or chest pain
- High fever or signs of infection
- Any symptoms that feel concerning or life-threatening

**Follow-up:**
Your health and peace of mind are important. Even if symptoms seem manageable, having them properly evaluated by a healthcare provider who can examine you in person is always the wisest course of action.

Is there anything specific about your symptoms or my recommendations you'd like me to clarify?`;
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medical-consultation function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      response: `I apologize, but I'm experiencing technical difficulties right now. For your safety and to ensure you receive proper medical care, please consider:

1. **If this is urgent**: Contact your healthcare provider directly or visit an urgent care center
2. **If this is non-urgent**: Try again in a few minutes, or schedule an appointment with your doctor
3. **For emergencies**: Always call emergency services or go to the nearest emergency room

Your health is the priority, and in-person medical care is always the gold standard for proper diagnosis and treatment.`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});