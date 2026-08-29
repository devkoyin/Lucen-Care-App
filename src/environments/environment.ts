// Development environment. Swapped for environment.prod.ts by the production
// build's fileReplacements (see angular.json).
//
// This file is committed and must never hold a secret. The Groq key that used to
// live here now sits on the backend behind POST /ai/chat — a browser bundle is
// readable by every user, so a key shipped here is a published key.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Feature flag, not a credential. False renders the "Coming Soon" panel in
  // ai-chat.component.html instead of the live chat.
  aiChatEnabled: true,
};
