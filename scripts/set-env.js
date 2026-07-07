const fs   = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env');
const envVars = {};

if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach(line => {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        envVars[key] = val;
      }
    });
}

// process.env takes priority so Vercel/Netlify env vars work at build time
const groqApiKey = process.env['GROQ_API_KEY'] || envVars['GROQ_API_KEY'] || '';

const content = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  groqApiKey: '${groqApiKey}',
};
`;

const dest = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(dest, content, 'utf8');

const status = groqApiKey ? '*** set ***' : '(empty — add GROQ_API_KEY to .env)';
console.log(`✓  environment.ts written  |  groqApiKey: ${status}`);
