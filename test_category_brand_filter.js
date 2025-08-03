// Test script to verify category-brand filtering
// This helps debug the issue with bikes and mobile phones

const testUrls = [
  'https://phonebay.xyz/catalog?category=bikes&brand=hero',
  'https://phonebay.xyz/catalog?category=mobile-phones&brand=samsung',
  'https://phonebay.xyz/catalog?category=ac&brand=haier',
  'https://phonebay.xyz/catalog?category=bikes&brand=honda'
];

function parseUrl(url) {
  const urlObj = new URL(url);
  const category = urlObj.searchParams.get('category');
  const brand = urlObj.searchParams.get('brand');
  
  console.log(`URL: ${url}`);
  console.log(`Category: ${category}`);
  console.log(`Brand: ${brand}`);
  
  // Simulate the API endpoint construction
  let endpoint = 'https://phonebay.xyz/api/products/products/?page=1';
  
  if (category) {
    endpoint += `&category_slug=${encodeURIComponent(category)}`;
  }
  
  if (brand) {
    endpoint += `&brand__slug=${encodeURIComponent(brand)}`;
  }
  
  console.log(`API Endpoint: ${endpoint}`);
  console.log('---');
  
  return { category, brand, endpoint };
}

console.log('Testing Category-Brand Filter Logic:');
console.log('====================================');

testUrls.forEach(url => {
  parseUrl(url);
});

console.log('\nExpected Behavior:');
console.log('- When both category and brand are present, API should filter by BOTH');
console.log('- The endpoint should include both category_slug and brand__slug parameters');
console.log('- This should return products that match BOTH the category AND brand'); 