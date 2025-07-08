// src/services/aiService.ts

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
  // Hardcoded to 'gemini' as it's the only provider now
  private provider: 'gemini' = 'gemini'; 
  
  // WARNING: Hardcoding API key directly in client-side code is a severe security risk.
  // This key will be visible to anyone inspecting your deployed website's source code.
  // For production, use a secure backend proxy or environment variables.
  private apiKey: string = 'AIzaSyCtOzbIl0QGADIQky0hS0KN-qGfoULchMo'; // Your provided Gemini API Key

  // Removed setProvider method as the provider and key are now hardcoded

  async generateMedicalResponse(symptoms: string, imageData?: string): Promise<MedicalResponse | string> {
    if (!this.apiKey) {
      // This check is mostly for safety, as the key is now hardcoded.
      throw new Error('API key not configured');
    }

    try {
      // Directly call callGemini as OpenAI is removed
      return await this.callGemini(symptoms, imageData);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to get Gemini AI response. Please check your API key and try again.');
    }
  }

  // Removed callOpenAI method

  private async callGemini(symptoms: string, imageData?: string): Promise<MedicalResponse | string> {
    const parts: any[] = [{ text: MEDICAL_PROMPT + symptoms }];
    
    if (imageData) {
      // Convert data URL to base64
      const base64Data = imageData.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Ensure this matches the actual image type if possible
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
    
    return this.parseAIResponse(content);
  }

  /**
   * Attempts to parse a structured JSON response from the AI's raw text output.
   * Handles cases where JSON might be wrapped in markdown code blocks or interspersed with other text.
   * @param content The raw string content from the AI.
   * @returns A MedicalResponse object if valid JSON is found and parsed, otherwise the original string content.
   */
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
