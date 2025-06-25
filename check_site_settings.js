// Script to test the site settings API endpoint
const axios = require('axios');

// Define the API endpoints to test
const API_ENDPOINTS = [
  'http://localhost:8000/api/admin/settings/',
  'http://localhost:8000/api/adminpanel/settings/'
];

// Test the API endpoints
async function testSiteSettings() {
  console.log('Testing site settings API endpoints...');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(`\nTesting endpoint: ${endpoint}`);
      const response = await axios.get(endpoint);
      
      if (response.data) {
        console.log('✅ Success! Response data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if logos are present
        console.log('\nLogo checks:');
        console.log(`Header logo: ${response.data.header_logo ? '✅ Present' : '❌ Missing'}`);
        console.log(`Footer logo: ${response.data.footer_logo ? '✅ Present' : '❌ Missing'}`);
        console.log(`Favicon: ${response.data.favicon ? '✅ Present' : '❌ Missing'}`);
        console.log(`Site name: ${response.data.site_name ? '✅ Present' : '❌ Missing'}`);
      } else {
        console.log('❌ No data returned');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
}

// Run the test
testSiteSettings(); 