# Shipping Data Setup

This directory contains files to help you set up shipping data for Bangladesh cities in your Phone Bay e-commerce application.

## Files Included

1. `city_postal_data.json` - Comprehensive data about cities in Bangladesh including postal codes and shipping details.
2. `shipping_fixtures.json` - Django fixtures for direct import to your database.
3. `import_city_data.py` - Python script to import data from `city_postal_data.json` into your database.

## Option 1: Using Django Fixtures (Recommended)

This is the quickest way to set up your shipping data:

```bash
python manage.py loaddata shipping_fixtures.json
```

This will create:
- 3 shipping methods (Standard, Express, and Same Day Delivery)
- 4 shipping zones (Dhaka, Chittagong, Sylhet, and Other Cities)
- 9 shipping rates with different pricing and free shipping thresholds

## Option 2: Using the Import Script

For more detailed city data including districts and native names:

```bash
# Make sure you're in the backend directory
cd /path/to/backend
python import_city_data.py
```

This script reads from `city_postal_data.json` and creates more detailed shipping zones for each city.

## Customize Free Shipping Thresholds

The "Free shipping on orders over ৳2000.00" message comes from the `free_shipping_threshold` value in the shipping rates.

- For Dhaka: Standard shipping is free over ৳2,000, Express shipping is free over ৳5,000
- For Chittagong/Sylhet: Standard shipping is free over ৳3,000, Express shipping is free over ৳6,000
- For Other Cities: Standard shipping is free over ৳4,000, Express shipping is free over ৳8,000

To change these thresholds, you can:

1. Edit the values in `shipping_fixtures.json` and reload the fixtures
2. Or edit directly in the Django admin panel
3. Or modify the values in `import_city_data.py` before running it

## Adding More Cities

To add more cities:

1. Edit `city_postal_data.json` to add new cities with their details
2. Run the import script again: `python import_city_data.py`

## Additional Notes

- The shipping method selection works based on the city entered by the user
- When a user enters a city, the system checks if it's in one of the shipping zones
- If found, it retrieves available shipping methods and rates for that zone
- Free shipping is applied automatically when order total exceeds the threshold 