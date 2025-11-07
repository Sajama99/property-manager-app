-- Insert sample properties
INSERT INTO public.properties (name, address, city, lat, lng) VALUES
  ('Baltic Steel Building A', '123 Main St', 'Boston', 42.3601, -71.0589),
  ('Baltic Steel Building B', '456 Oak Ave', 'Cambridge', 42.3736, -71.1097),
  ('Baltic Steel Building C', '789 Elm St', 'Somerville', 42.3876, -71.0995),
  ('Baltic Steel Building D', '321 Pine Rd', 'Brookline', 42.3318, -71.1212),
  ('Baltic Steel Building E', '654 Maple Dr', 'Newton', 42.3370, -71.2092)
ON CONFLICT DO NOTHING;
