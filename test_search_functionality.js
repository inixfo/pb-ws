// Test script to verify search functionality
// This helps debug the search issues

const testSearchQueries = [
  'samsung phone',
  'bike',
  'laptop',
  'mobile',
  'ac',
  'refrigerator'
];

async function testSearch(query) {
  console.log(`\n🔍 Testing search for: "${query}"`);
  
  try {
    // Test the search endpoint
    const searchUrl = `https://phonebay.xyz/api/products/search/?q=${encodeURIComponent(query)}&page=1&page_size=5`;
    console.log(`Search URL: ${searchUrl}`);
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Results count: ${data.count || 0}`);
    console.log(`Did you mean: ${data.did_you_mean || 'None'}`);
    
    if (data.results && data.results.length > 0) {
      console.log('First few results:');
      data.results.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (${product.category?.name || 'No category'})`);
      });
    } else {
      console.log('No results found');
    }
    
    return data;
  } catch (error) {
    console.error(`Error testing search for "${query}":`, error.message);
    return null;
  }
}

async function testAutocomplete(query) {
  console.log(`\n💡 Testing autocomplete for: "${query}"`);
  
  try {
    const autocompleteUrl = `https://phonebay.xyz/api/products/autocomplete/?q=${encodeURIComponent(query)}&limit=5`;
    console.log(`Autocomplete URL: ${autocompleteUrl}`);
    
    const response = await fetch(autocompleteUrl);
    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Suggestions count: ${data.suggestions?.length || 0}`);
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('Suggestions:');
      data.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion.name} (${suggestion.type})`);
      });
    } else {
      console.log('No suggestions found');
    }
    
    return data;
  } catch (error) {
    console.error(`Error testing autocomplete for "${query}":`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Search Functionality');
  console.log('================================');
  
  for (const query of testSearchQueries) {
    await testSearch(query);
    await testAutocomplete(query);
  }
  
  console.log('\n✅ Search functionality test completed!');
  console.log('\n📋 Expected Behavior:');
  console.log('- Search should return relevant products based on keywords');
  console.log('- Autocomplete should provide helpful suggestions');
  console.log('- "Did you mean" should appear for typos');
  console.log('- Results should be filtered, not show all products');
}

// Run the tests
runTests().catch(console.error); 