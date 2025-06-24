
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [];

// Only initialize the googleAI plugin if the API key is available in the environment.
// This prevents the server from crashing on startup if the key is not set.
if (process.env.GOOGLE_API_KEY) {
  plugins.push(googleAI());
} else {
  // Log a warning so it's clear why AI features might be disabled.
  console.warn("GOOGLE_API_KEY environment variable not set. AI features will be disabled.");
}

export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-2.0-flash',
});
