🏥 Medical Consultation AI Assistant
An AI-powered chatbot designed to provide preliminary guidance on medical symptoms and recommend appropriate medical departments for consultation. It utilizes large language models (LLMs) to analyze user input, including text descriptions and image uploads, offering structured advice with urgency levels and next steps.

Disclaimer: This application is for informational purposes only and does not provide medical diagnosis or treatment. Always consult with a qualified healthcare professional for any medical concerns.

✨ Features
Symptom Analysis: Describe your symptoms in natural language.

Image Upload: Upload images for AI analysis (e.g., skin conditions).

Department Recommendation: Get suggestions for the relevant medical department (e.g., Dermatology, Cardiology).

Urgency Assessment: Receive an urgency level (low, medium, high, emergency) based on the described symptoms.

Practical Next Steps: Get actionable advice on what to do next.

AI-Powered Responses: Utilizes Google Gemini (and optionally OpenAI) for intelligent responses.

Responsive Dark UI: A modern, sleek dark mode interface for comfortable use.

🚀 Technologies Used
React: Frontend JavaScript library for building user interfaces.

Vite: Fast build tool for modern web projects.

TypeScript: Type-safe JavaScript.

Tailwind CSS: Utility-first CSS framework for rapid styling.

Lucide React: Icon library for React components.

Shadcn/ui: Reusable UI components built with Radix UI and Tailwind CSS.

React Router DOM: For client-side routing.

React Query (@tanstack/react-query): For data fetching, caching, and state management.

Google Gemini API: For AI-powered medical consultations.

OpenAI API: (Optional) For AI-powered medical consultations.

⚙️ Setup and Installation
Clone the repository:

git clone https://github.com/sau-rabh-7/medical-assistant.github.io.git
cd medical-assistant.github.io

Install dependencies:

npm install
# OR
yarn install

API Key Configuration:
This application uses a hardcoded Google Gemini API key for demonstration purposes. For production use or if you plan to share your code publicly, it is highly recommended to secure your API key using a backend proxy or serverless function.
The API key is currently located in src/services/aiService.ts.

▶️ How to Run Locally
Start the development server:

npm run dev
# OR
yarn dev

This will typically open the application in your browser at http://localhost:8080 (or another port).

Preview Production Build (Recommended for accurate local testing):
To see how the application will behave when deployed (including correct routing for GitHub Pages):

npm run build
npm run preview

The preview server will usually indicate the URL to access, which might be http://localhost:4173/medical-assistant.github.io/ or similar, respecting the base path configured for GitHub Pages.

🌐 Deployment to GitHub Pages
This project is configured for deployment to GitHub Pages, specifically for a User/Organization Page repository named medical-assistant.github.io.

The vite.config.ts is set with base: '/medical-assistant.github.io/' and BrowserRouter in App.tsx uses basename="/medical-assistant.github.io/" to ensure correct asset loading and routing on GitHub Pages.

To deploy:

Ensure your vite.config.ts and App.tsx have the correct base and basename paths as mentioned above.

Build your project: npm run build

Push your gh-pages branch (containing the dist folder content) to your medical-assistant.github.io repository.

Your application should be accessible at https://medical-assistant.github.io/.

⚠️ Important Disclaimer
This Medical Consultation AI Assistant is designed to provide general information and preliminary guidance based on the input provided. It is powered by artificial intelligence and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare professional for any medical questions or concerns. In case of a medical emergency, call emergency services immediately.