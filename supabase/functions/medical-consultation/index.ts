import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple medical response generator using rule-based approach
const generateMedicalResponse = (symptoms: string, patientContext?: any) => {
  const responses = {
    headache: [
      `${patientContext?.name ? `Hi ${patientContext.name}, ` : 'Hello, '}I see you're dealing with a headache. These can be quite uncomfortable. From what you're describing, it could be tension-related, especially if you've been under stress lately, or it might be due to dehydration or lack of sleep. Have you been drinking enough water today? I'd suggest finding a quiet, dark room to rest in for a bit. A cool compress on your forehead might help too. If you have some ibuprofen or acetaminophen at home, that could provide relief, but make sure to follow the dosage instructions.`,
      `Now, I want you to keep an eye on this headache. If it becomes severe, happens frequently, or if you notice any changes in your vision, neck stiffness, or develop a fever along with it, I'd want you to see a doctor right away. Those could be signs of something more serious that needs immediate attention.`
    ],
    fever: [
      `${patientContext?.name ? `${patientContext.name}, ` : ''}a fever tells me your body is working hard to fight off something, likely an infection. That's actually a good sign that your immune system is doing its job. Right now, focus on staying well-hydrated - water, herbal teas, or clear broths are all good choices. Rest is crucial too, so don't feel guilty about taking it easy. You can use fever reducers like acetaminophen or ibuprofen to help you feel more comfortable, but don't feel like you have to bring the fever down completely.`,
      `I do want you to monitor your temperature though. If it climbs above 103°F or stays elevated for more than three days, that's when I'd want you to come in. Also, watch for any trouble breathing, severe headache, or persistent vomiting - those would be reasons to seek care sooner rather than later.`
    ],
    cough: [
      `${patientContext?.name ? `I hear you, ${patientContext.name}, ` : ''}coughs can be really annoying, can't they? There are several things that could be causing this - it might be a viral infection, allergies acting up, or even just irritation from dry air or strong smells. For now, try to stay hydrated as it helps thin any mucus. A spoonful of honey can be surprisingly effective for soothing your throat, and warm tea with lemon might feel good too. If the air in your home is dry, a humidifier could help.`,
      `Keep track of how long this cough lasts. If it's still bothering you after two weeks, or if you start coughing up blood, or develop fever and difficulty breathing along with it, those are signals that we need to take a closer look at what's going on.`
    ],
    "stomach pain": [
      `${patientContext?.name ? `${patientContext.name}, ` : ''}stomach pain can have so many different causes, and I know how uncomfortable it can be. Think about when it started - was it after eating something specific? Are you feeling stressed? Sometimes our digestive system really responds to what's going on in our lives. For now, try sticking to bland, easy-to-digest foods like toast, rice, or bananas. Avoid anything spicy, greasy, or acidic for a day or two.`,
      `Pay attention to where exactly the pain is and how it feels - is it cramping, sharp, or more of a dull ache? If the pain becomes severe, you start vomiting blood, or you become dehydrated, don't wait - get medical help right away. Those are signs we can't ignore.`
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
    const greeting = patientContext?.name ? `${patientContext.name}, thanks for reaching out about your symptoms. ` : 'Thank you for sharing what you\'re experiencing with me. ';
    selectedResponses = [
      `${greeting}While I can offer some general guidance based on what you've told me, I think it would be best for you to have a proper examination so we can get to the bottom of what's going on.`,
      `In the meantime, keep monitoring how you're feeling. If things get worse or you develop any new symptoms that concern you, don't hesitate to seek medical care. Trust your instincts about your body.`
    ];
  }

  // Build natural response
  let response = selectedResponses.join(' ');
  
  if (patientContext?.medical_history && patientContext.medical_history !== 'none') {
    response += ` Given your history with ${patientContext.medical_history}, I'd especially encourage you to discuss these symptoms with your regular doctor who knows your medical background.`;
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