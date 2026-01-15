-- Create government jurisdictions table for location-based report assignment
-- This enables automatic assignment of reports to government authorities based on location

-- Create government_jurisdictions table
CREATE TABLE IF NOT EXISTS public.government_jurisdictions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    government_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    government_code text UNIQUE NOT NULL, -- e.g., GOV_VDR_001
    city_name text NOT NULL,
    state text DEFAULT 'Gujarat' NOT NULL,
    boundary_type text CHECK (boundary_type IN ('city', 'coordinates')) DEFAULT 'city',
    boundary_data jsonb NOT NULL, -- City names array or polygon coordinates
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key from reports to government_jurisdictions
ALTER TABLE public.reports
ADD CONSTRAINT reports_government_id_fkey 
FOREIGN KEY (government_id) REFERENCES public.government_jurisdictions(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_govt_jurisdictions_user_id ON public.government_jurisdictions(government_user_id);
CREATE INDEX IF NOT EXISTS idx_govt_jurisdictions_code ON public.government_jurisdictions(government_code);
CREATE INDEX IF NOT EXISTS idx_govt_jurisdictions_city ON public.government_jurisdictions(city_name);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.government_jurisdictions ENABLE ROW LEVEL SECURITY;

-- Policy: Government users can view their own jurisdiction
CREATE POLICY "Government users can view own jurisdiction"
ON public.government_jurisdictions
FOR SELECT
USING (
    government_user_id = auth.uid()
    OR 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('ngo', 'admin')
    )
);

-- Policy: Only admins can insert/update jurisdictions
CREATE POLICY "Only admins can manage jurisdictions"
ON public.government_jurisdictions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Government jurisdictions table created successfully!';
END $$;
