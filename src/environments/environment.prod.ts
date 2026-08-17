// Production environment. Substituted for environment.ts at build time via the
// production configuration's fileReplacements in angular.json — without that
// entry this file is inert and a production bundle talks to localhost.
//
// Committed, so no secrets. See environment.ts for why.
export const environment = {
  production: true,
  apiUrl: 'https://api.lucencare.com/api',
  aiChatEnabled: true,
};
