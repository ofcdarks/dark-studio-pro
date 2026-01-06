-- Create credit_packages table for storing configurable credit packages
CREATE TABLE public.credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can see packages)
CREATE POLICY "Credit packages are viewable by everyone"
ON public.credit_packages
FOR SELECT
USING (true);

-- Create policy for admin write access
CREATE POLICY "Admins can manage credit packages"
ON public.credit_packages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default credit packages
INSERT INTO public.credit_packages (credits, price, label, display_order) VALUES
(1000, 99.90, 'Alocação básica', 1),
(2500, 149.90, 'Expansão moderada', 2),
(5000, 249.90, 'Execução intensiva', 3),
(10000, 399.90, 'Escala prolongada', 4),
(20000, 699.90, 'Contínuo de alta demanda', 5);

-- Add trigger for updated_at
CREATE TRIGGER update_credit_packages_updated_at
BEFORE UPDATE ON public.credit_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();