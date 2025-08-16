-- Create onboarding_data table to store complete onboarding information
-- This serves as a backup and debugging tool for the onboarding webhook system

CREATE TABLE IF NOT EXISTS onboarding_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id),
  gym_name TEXT NOT NULL,
  gym_email TEXT,
  business_details JSONB,
  brand_identity JSONB,
  audience_services JSONB,
  links_socials JSONB,
  marketing_content JSONB,
  media JSONB,
  submitted_at TIMESTAMPTZ,
  gym_slug TEXT,
  webhook_received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_onboarding_data_gym_id ON onboarding_data(gym_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_gym_slug ON onboarding_data(gym_slug);
CREATE INDEX IF NOT EXISTS idx_onboarding_data_created_at ON onboarding_data(created_at);

-- Add RLS policy for security
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON onboarding_data TO authenticated;
GRANT ALL ON onboarding_data TO service_role;

-- Insert sample data structure for reference
INSERT INTO onboarding_data (
  gym_id,
  gym_name,
  gym_email,
  business_details,
  brand_identity,
  audience_services,
  links_socials,
  marketing_content,
  media,
  submitted_at,
  gym_slug
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SAMPLE GYM',
  'sample@gym.com',
  '{"first_name": "John", "last_name": "Doe", "phone": "1234567890", "website": "https://www.samplegym.com", "city": "Sample City", "address": "123 Sample St"}',
  '{"brand_color": "#000000", "brand_style": "CrossFit"}',
  '{"target_audience": "Fitness enthusiasts", "services": "CrossFit classes", "desired_results": "Strength and conditioning"}',
  '{"google_map_url": "https://maps.google.com", "instagram_url": "https://www.instagram.com/samplegym"}',
  '{"primary_cta": "Join us today!", "testimonial": "Amazing results!"}',
  '{"white_logo_url": "https://drive.google.com/file/d/sample1/view", "black_logo_url": "https://drive.google.com/file/d/sample2/view"}',
  NOW(),
  'sample-gym'
) ON CONFLICT DO NOTHING;

-- Create view for easy access to complete onboarding data
CREATE OR REPLACE VIEW onboarding_data_complete AS
SELECT 
  od.*,
  g."Gym Name" as gym_name_from_gyms,
  g."Email" as gym_email_from_gyms,
  g."Agency" as agency_id,
  CASE 
    WHEN od.business_details IS NOT NULL THEN 1 
    ELSE 0 
  END +
  CASE 
    WHEN od.brand_identity IS NOT NULL THEN 1 
    ELSE 0 
  END +
  CASE 
    WHEN od.audience_services IS NOT NULL THEN 1 
    ELSE 0 
  END +
  CASE 
    WHEN od.links_socials IS NOT NULL THEN 1 
    ELSE 0 
  END +
  CASE 
    WHEN od.marketing_content IS NOT NULL THEN 1 
    ELSE 0 
  END +
  CASE 
    WHEN od.media IS NOT NULL THEN 1 
    ELSE 0 
  END as data_completeness_score
FROM onboarding_data od
LEFT JOIN gyms g ON od.gym_id = g.id;

-- Grant access to the view
GRANT SELECT ON onboarding_data_complete TO authenticated;
GRANT SELECT ON onboarding_data_complete TO service_role;
