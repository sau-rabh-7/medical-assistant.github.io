// aiService.ts (Updated)

interface MedicalResponse {
  department: string;
  reasoning: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  nextSteps: string[];
  disclaimer: string;
}

const MEDICAL_PROMPT = `You are a medical consultation assistant. Analyze the user's message and respond appropriately:

1. If the user is greeting you or asking general questions (like "hello", "hi", "how are you", etc.), respond naturally as a friendly medical assistant WITHOUT using the JSON format.

2. If the user is describing medical symptoms or asking for medical advice, then use this exact JSON format. ENSURE THE JSON IS PURE, VALID JSON WITHOUT ANY LEADING/TRAILING TEXT OR MARKDOWN BACKTICKS (e.g., \`\`\`json). Provide ONLY the JSON object.
{
  "department": "Recommended medical department (e.g., Cardiology, Dermatology, Internal Medicine)",
  "reasoning": "Clear explanation of why this department is recommended based on the symptoms",
  "urgency": "low|medium|high|emergency",
  "nextSteps": ["Step 1", "Step 2", "Step 3"],
  "disclaimer": "Important medical disclaimer"
}

Guidelines for medical responses:
- Be professional and empathetic
- Focus on symptoms, not diagnosis
- Recommend appropriate medical departments
- Include urgency level based on symptoms
- Provide 3-4 practical next steps
- Always include appropriate medical disclaimers
- If symptoms suggest emergency, set urgency to "emergency"
- For skin issues → Dermatology
- For heart/chest issues → Cardiology  
- For joint/muscle issues → Rheumatology/Orthopedics
- For mental health → Psychiatry/Psychology
- For general symptoms → Internal Medicine

User's message: `;

export class AIService {
  private provider: 'openai' | 'gemini' = 'gemini';
  // WARNING: Hardcoding API key directly in client-side code is a security risk.
  // This key will be visible to anyone inspecting your deployed website's source code.
  private apiKey: string = 'AIzaSyCtOzbIl0QGADIQky0hS0KN-qGfoULchMo';

  setProvider(provider: 'openai' | 'gemini', apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  async generateMedicalResponse(symptoms: string, imageData?: string): Promise<MedicalResponse | string> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      if (this.provider === 'openai') {
        return await this.callOpenAI(symptoms, imageData);
      } else {
        return await this.callGemini(symptoms, imageData);
      }
    } catch (error) {
      console.error('AI API Error:', error);
      throw new Error('Failed to get AI response. Please check your API key and try again.');
    }
  }

  private async callOpenAI(symptoms: string, imageData?: string): Promise<MedicalResponse | string> {
    const messages: any[] = [
      {
        role: 'system',
        content: MEDICAL_PROMPT // Use the detailed prompt for the system role
      }
    ];

    if (imageData) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: symptoms },
          { type: 'image_url', image_url: { url: imageData } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: symptoms
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Make sure this model supports JSON mode if you were aiming for it
        messages,
        max_tokens: 1000,
        temperature: 0.3,
        // Optional: If 'gpt-4o' supports JSON response mode, add it.
        // For example, for gpt-3.5-turbo-1106 and newer, you could use:
        // response_format: { type: "json_object" }
        // However, your prompt already guides it strongly.
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API full error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    return this.parseAIResponse(content); // Use the new parsing method
  }

  private async callGemini(symptoms: string, imageData?: string): Promise<MedicalResponse | string> {
    const parts: any[] = [{ text: MEDICAL_PROMPT + symptoms }];
    
    if (imageData) {
      // Convert data URL to base64
      const base64Data = imageData.split(',')[1];
      parts.push({
        inlineData: {
          // Adjust mimeType if you're uploading PNGs or other formats
          mimeType: 'image/jpeg', 
          data: base64Data
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
          // Gemini's response_mime_type can be set for stricter JSON output
          // output_config: { response_mime_type: "application/json" } // For Gemini 1.5 Pro and Flash
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API full error:", errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;
    
    return this.parseAIResponse(content); // Use the new parsing method
  }

  // --- NEW PRIVATE METHOD TO PARSE AI RESPONSE ---
  private parseAIResponse(content: string): MedicalResponse | string {
    if (!content) {
        return this.parseFallbackResponse("No content received from AI.");
    }

    // 1. Try to find JSON within markdown code blocks (```json ... ```)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const jsonResponse = JSON.parse(jsonMatch[1]);
            if (jsonResponse.department && jsonResponse.reasoning) {
                return jsonResponse;
            }
        } catch (e) {
            console.warn("Failed to parse JSON from markdown block:", e);
        }
    }

    // 2. Try to find standalone JSON object (e.g., { ... })
    // This regex looks for a string starting with '{' and ending with '}'
    // and tries to extract the content between the first '{' and last '}'
    // This is a bit more aggressive and might pick up partial JSON if not careful.
    const potentialJsonMatch = content.match(/\{[\s\S]*\}/);
    if (potentialJsonMatch && potentialJsonMatch[0]) {
        try {
            const jsonResponse = JSON.parse(potentialJsonMatch[0]);
            if (jsonResponse.department && jsonResponse.reasoning) {
                return jsonResponse;
            }
        } catch (e) {
            console.warn("Failed to parse standalone JSON:", e);
        }
    }

    // 3. If no valid JSON is found or parsed, return the original content as plain text
    // This means general greetings or cases where the AI completely failed to adhere to JSON.
    return content;
  }

  private parseFallbackResponse(content: string): MedicalResponse {
    return {
      department: 'Internal Medicine',
      reasoning: content || 'Unable to process the response properly. Please consult with a healthcare professional.',
      urgency: 'medium',
      nextSteps: [
        'Schedule an appointment with a healthcare provider',
        'Prepare a list of your symptoms and medical history',
        'Consider seeking immediate care if symptoms worsen'
      ],
      disclaimer: 'This is AI-generated guidance. Always consult with qualified healthcare professionals for proper medical advice.'
    };
  }
}

export const aiService = new AIService();