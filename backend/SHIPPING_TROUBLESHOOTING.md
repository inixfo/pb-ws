# Shipping Zone Troubleshooting Guide

## City Matching Issues

If you're experiencing issues with shipping zones not matching correctly, such as:
- The "Free shipping on orders over ৳X" message not appearing
- Wrong shipping rates being applied for a city
- City not being recognized at all

Follow these steps to diagnose and fix the issue:

## Diagnosing City Matching Issues

1. Use the test script to check how your city matches to zones:

```bash
python test_shipping_city.py dhaka
```

2. Check for these common issues:
   - Case sensitivity: Make sure your zones include both lowercase and capitalized versions of city names
   - Whitespace: Check if there's extra whitespace in city names
   - Pluralization: Some users may enter "Dhaka City" instead of just "Dhaka"

3. Use the debug API endpoint (useful when diagnosing frontend issues):
   ```
   GET /api/shipping/zones/debug_city/?city=dhaka
   ```

## Common Fixes

### 1. Update City Names in Shipping Zones

If your city is not matching correctly, edit the shipping zone to include variations:

```python
# In Django admin, update the cities list to include variations:
["dhaka", "Dhaka", "DHAKA", "dhaka city"]
```

### 2. Fix Case Sensitivity Issues in Frontend

In your React components, normalize city names before sending to the API:

```javascript
// Convert to lowercase before sending to API
const normalizedCity = city.trim().toLowerCase();
```

### 3. Update Shipping Fixtures

If using fixtures, make sure they include all city name variations:

```json
"cities": ["dhaka", "Dhaka", "DHAKA"],
```

### 4. Reload Fixtures

If you've updated the shipping fixtures, reload them:

```bash
python manage.py loaddata shipping_fixtures.json
```

## Testing Free Shipping Thresholds

If the "Free shipping on orders over ৳X" message is not appearing:

1. Verify the shipping rate has a `free_shipping_threshold` value set:
   ```bash
   python test_shipping_city.py dhaka
   ```

2. Check the frontend rendering logic to ensure it's displaying the threshold correctly

3. For testing, create orders with different total amounts to verify the free shipping threshold is working as expected:
   - Order below threshold: Should show shipping cost
   - Order above threshold: Should show "Free" or "Free (Qualified)" 