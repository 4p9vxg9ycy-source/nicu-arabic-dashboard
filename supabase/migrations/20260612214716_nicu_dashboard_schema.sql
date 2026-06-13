-- NICU Dashboard Database Schema

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  gestational_age INTEGER NOT NULL,
  admission_date DATE NOT NULL,
  incubator_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'critical')),
  nurse_primary TEXT,
  nurse_secondary TEXT,
  tpn_status TEXT DEFAULT 'pending',
  fluids_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  times TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_type TEXT NOT NULL CHECK (log_type IN ('feeding', 'output', 'urination')),
  value TEXT,
  amount_ml INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  image_url TEXT,
  thumbnail_url TEXT,
  analysis_type TEXT,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_url TEXT,
  sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  records_updated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success'
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_patients" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_patients" ON patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true)
CREATE POLICY "delete_patients" ON patients FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_medications" ON medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_medications" ON medications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_medications" ON medications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_medications" ON medications FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_daily_logs" ON daily_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_daily_logs" ON daily_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_daily_logs" ON daily_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_daily_logs" ON daily_logs FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_lab_results" ON lab_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_lab_results" ON lab_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_lab_results" ON lab_results FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_lab_results" ON lab_results FOR DELETE TO authenticated USING (true);

CREATE POLICY "select_sync_log" ON sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_sync_log" ON sync_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_daily_logs_patient ON daily_logs(patient_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX idx_lab_results_patient ON lab_results(patient_id);
