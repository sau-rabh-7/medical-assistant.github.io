import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple medical response generator using rule-based approach
const generateMedicalResponse = (symptoms: string, patientContext?: any) => {
  const responses = {
    headache: [
      "I understand you're experiencing a headache. Common causes include tension, dehydration, lack of sleep, or stress. Try resting in a quiet, dark room, staying hydrated, and consider over-the-counter pain relief if appropriate.",
      "For your headache, I recommend monitoring the frequency and intensity. If headaches become severe, frequent, or are accompanied by other symptoms like fever, vision changes, or neck stiffness, please consult a healthcare provider immediately."
    ],
    fever: [
      "Fever can indicate your body is fighting an infection. Make sure to stay hydrated, rest, and monitor your temperature. If fever exceeds 103°F (39.4°C) or persists for more than 3 days, seek medical attention.",
      "Along with rest and hydration, you can use fever-reducing medications as directed. Watch for warning signs like difficulty breathing, severe headache, or persistent vomiting."
    ],
    cough: [
      "A cough can be due to various causes including viral infections, allergies, or irritants. Stay hydrated, consider honey for throat soothing, and avoid smoke or strong odors.",
      "If your cough persists for more than 2 weeks, produces blood, or is accompanied by fever and difficulty breathing, please consult a healthcare provider."
    ],
    "stomach pain": [
      "Stomach pain can have many causes. Try to identify if it's related to eating, stress, or other factors. Avoid spicy, fatty, or acidic foods and consider small, bland meals.",
      "Monitor the pain's location, intensity, and duration. Seek immediate care if you experience severe pain, vomiting blood, or signs of dehydration."
    ]
  };

  // Simple keyword matching
  const lowerSymptoms = symptoms.toLowerCase();
  let selectedResponses: string[] = [];
  
  for (const [condition, conditionResponses] of Object.entries(responses)) {
    if (lowerSymptoms.includes(condition)) {
      selectedResponses = conditionResponses;
      break;
    }
  }

  // Default response if no specific condition matched
  if (selectedResponses.length === 0) {
    selectedResponses = [
      "Thank you for sharing your symptoms with me. While I can provide general guidance, it's important to have a proper medical evaluation for an accurate diagnosis.",
      "Based on what you've described, I recommend monitoring your symptoms closely. If they worsen, persist, or you develop new concerning symptoms, please consult with a healthcare provider."
    ];
  }

  // Build comprehensive response
  let response = `Hello${patientContext?.name ? ` ${patientContext.name}` : ''}! I understand you're experiencing: ${symptoms}\n\n`;
  
  response += selectedResponses.join('\n\n');
  
  response += '\n\n**Important Reminders:**\n';
  response += '- This is general guidance and not a substitute for professional medical advice\n';
  response += '- For urgent symptoms or emergencies, contact emergency services immediately\n';
  response += '- Consider scheduling an appointment with your healthcare provider for proper evaluation\n';
  
  if (patientContext?.medical_history && patientContext.medical_history !== 'none') {
    response += `\n**Note:** Given your medical history of ${patientContext.medical_history}, please discuss these symptoms with your regular healthcare provider.`;
  }

  return response;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, patientContext, imageData } = await req.json();
    
    console.log('Received request:', { symptoms, patientContext: !!patientContext, hasImage: !!imageData });

    // Generate response using the rule-based system
    const aiResponse = generateMedicalResponse(symptoms, patientContext);

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