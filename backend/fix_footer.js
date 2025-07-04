// Fix script for CtaFooterByAnima.tsx
const fs = require("fs");
const path = require("path");

// Path to the footer component
const footerFilePath = path.join(__dirname, "../home/src/screens/ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima.tsx");

// Read the file content
let content = fs.readFileSync(footerFilePath, "utf8");

// Add the import for SiteSettings context
if (!content.includes("import { useSiteSettings }")) {
  content = content.replace(
    "import { categoryService, contactService } from \"../../../../services/api\";",
    "import { categoryService, contactService } from \"../../../../services/api\";\nimport { useSiteSettings } from \"../../../../contexts/SiteSettingsContext\";"
  );
}

// Add the site settings hook
if (!content.includes("const { settings } = useSiteSettings()")) {
  content = content.replace(
    "// Contact info state for social media links",
    "// Get site settings for logo\n  const { settings } = useSiteSettings();\n\n  // Contact info state for social media links"
  );
}

// Update the logo to use site settings
content = content.replace(
  /<img className="w-24 h-10" alt="Logo" src="\/logo.png" \/>/,
  `<img \n                className="w-24 h-10" \n                alt={\`\${settings.site_name || "Phone Bay"} Logo\`} \n                src={settings.footer_logo || "/logo.png"} \n                onError={(e) => {\n                  console.log("[Footer] Logo failed to load, using fallback");\n                  e.currentTarget.src = "/logo.png";\n                }}\n              />`
);

// Write the updated content back to the file
fs.writeFileSync(footerFilePath, content);

console.log("Footer component updated successfully!");
