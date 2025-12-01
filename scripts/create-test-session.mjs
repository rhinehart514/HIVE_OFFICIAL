#!/usr/bin/env node
/**
 * Create a test session for local development
 * Run with: node scripts/create-test-session.mjs
 */

import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('Could not read .env.local file:', error.message);
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SESSION_SECRET = envVars.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('SESSION_SECRET not found in .env.local');
  process.exit(1);
}

const secret = new TextEncoder().encode(SESSION_SECRET);

const sessionData = {
  userId: 'test-user-playwright',
  email: 'test@buffalo.edu',
  campusId: 'ub-buffalo',
  isAdmin: false,
  verifiedAt: new Date().toISOString(),
  sessionId: 'test-session-' + Date.now(),
};

const token = await new SignJWT(sessionData)
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(sessionData.userId)
  .setIssuedAt()
  .setExpirationTime('30d')
  .sign(secret);

console.log('=== Test Session Token ===');
console.log(token);
console.log('');
console.log('To use in browser, run this in the console:');
console.log(`document.cookie = "hive_session=${token}; path=/";`);
console.log('');
console.log('Or use with curl:');
console.log(`curl -H "Cookie: hive_session=${token}" http://localhost:3001/api/auth/me`);
