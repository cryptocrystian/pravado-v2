/**
 * Generate placeholder PNG assets for EAS build.
 * Replace with real brand assets before App Store submission.
 *
 * Run: node apps/mobile/scripts/generate-placeholders.js
 *
 * NOTE: If sharp is not installed, this creates minimal 1x1 PNGs.
 * Real assets should be:
 * - icon.png: 1024x1024
 * - splash.png: 2048x2048
 * - adaptive-icon.png: 1024x1024
 * - favicon.png: 196x196
 */

const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (solid #0A0A0F)
// This is a base64-encoded 1x1 pixel PNG
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, '..', 'assets');

['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'].forEach(name => {
  const filePath = path.join(assetsDir, name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, PLACEHOLDER_PNG);
    console.log(`Created placeholder: ${name}`);
  } else {
    console.log(`Already exists: ${name}`);
  }
});

console.log('\nPlaceholder assets created.');
console.log('IMPORTANT: Replace with real brand assets before App Store submission.');
