// Fix script for HeaderByAnima.tsx
const fs = require("fs");
const path = require("path");

// Path to the header component
const headerFilePath = path.join(__dirname, "../home/src/screens/ElectronicsStore/sections/HeaderByAnima/HeaderByAnima.tsx");

// Read the file content
let content = fs.readFileSync(headerFilePath, "utf8");

// Add the import for SiteSettings context
if (!content.includes("import { useSiteSettings }")) {
  content = content.replace(
    "import { SearchBar } from \"../../../../components/SearchBar/SearchBar\";",
    "import { SearchBar } from \"../../../../components/SearchBar/SearchBar\";\nimport { useSiteSettings } from \"../../../../contexts/SiteSettingsContext\";"
  );
}

// Add the site settings hook
if (!content.includes("const { settings } = useSiteSettings()")) {
  content = content.replace(
    "// Fetch cart when the component mounts",
    "// Get site settings for logo\n  const { settings } = useSiteSettings();\n\n  // Fetch cart when the component mounts"
  );
}

// Update the logo to use site settings
content = content.replace(
  /<Link to="\\/">\s*<img className="h-8 sm:h-10 w-auto sm:w-\[141px\]" alt="Phone Bay Logo" src="\/logo.png" \/>\s*<\/Link>/,
  `<Link to="/">\n            <img \n              className="h-8 sm:h-10 w-auto sm:w-[141px]" \n              alt={\`\${settings.site_name || "Phone Bay"} Logo\`} \n              src={settings.header_logo || "/logo.png"} \n              onError={(e) => {\n                console.log("[Header] Logo failed to load, using fallback");\n                e.currentTarget.src = "/logo.png";\n              }}\n            />\n          </Link>`
);

// Write the updated content back to the file
fs.writeFileSync(headerFilePath, content);

console.log("Header component updated successfully!");
