// Debug script to test search API directly
const axios = require('axios');

async function testSearchAPI() {
  console.log('🔍 Testing Search API Directly');
  console.log('================================');
  
  const testQueries = ['samsung', 'phone', 'bike'];
  
  for (const query of testQueries) {
    console.log(`\nTesting query: "${query}"`);
    
    try {
      // Test the search endpoint
      const searchUrl = `https://phonebay.xyz/api/products/search/?q=${encodeURIComponent(query)}&page=1&page_size=5`;
      console.log(`Search URL: ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Response status: ${response.status}`);
      console.log(`✅ Results count: ${response.data.count || 0}`);
      console.log(`✅ Did you mean: ${response.data.did_you_mean || 'None'}`);
      
      if (response.data.results && response.data.results.length > 0) {
        console.log('✅ First few results:');
        response.data.results.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (${product.category?.name || 'No category'})`);
        });
      } else {
        console.log('⚠️  No results found');
      }
      
    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error.message);
      
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, error.response.data);
      } else if (error.request) {
        console.error(`   No response received`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n🔍 Testing Regular Products API');
  console.log('================================');
  
  try {
    // Test the regular products endpoint
    const productsUrl = 'https://phonebay.xyz/api/products/products/?page=1&page_size=5';
    console.log(`Products URL: ${productsUrl}`);
    
    const response = await axios.get(productsUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Results count: ${response.data.count || 0}`);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('✅ First few products:');
      response.data.results.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (${product.category?.name || 'No category'})`);
      });
    } else {
      console.log('⚠️  No products found');
    }
    
  } catch (error) {
    console.error(`❌ Error testing products API:`, error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else if (error.request) {
      console.error(`   No response received`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Run the test
testSearchAPI().catch(console.error); 