const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(process.cwd(), 'home', 'src', 'screens', 'ElectronicsStore', 'sections', 'HeaderByAnima', 'HeaderByAnima.tsx');

// Read the file
console.log(`Reading file: ${filePath}`);
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicate settings declaration
console.log('Fixing duplicate settings declaration...');
content = content.replace(
  /\/\/ Get site settings for logo\s+const { settings } = useSiteSettings\(\);\s+\/\/ Get site settings for logo\s+const { settings } = useSiteSettings\(\);/g,
  '// Get site settings for logo\n  const { settings } = useSiteSettings();'
);

// Check if there are duplicate imports
console.log('Checking for duplicate imports...');
const importPattern = /import {[\s\S]*?} from "lucide-react";[\s\S]*?import {[\s\S]*?} from "lucide-react";/;
if (importPattern.test(content)) {
  console.log('Found duplicate imports, fixing...');
  
  // Extract the first import section
  const firstImportSection = content.match(/^([\s\S]*?)export const HeaderByAnima/)[1];
  
  // Extract the component part (after the first import section)
  const componentPart = content.match(/export const HeaderByAnima[\s\S]*/)[0];
  
  // Remove any duplicate import sections from the component part
  const cleanedComponentPart = componentPart.replace(/import {[\s\S]*?} from ".*?";(\s*import {[\s\S]*?} from ".*?";)*/g, '');
  
  // Combine the first import section with the cleaned component part
  content = firstImportSection + cleanedComponentPart;
}

// Write the fixed content back to the file
console.log('Writing fixed content back to file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fix completed successfully!'); 