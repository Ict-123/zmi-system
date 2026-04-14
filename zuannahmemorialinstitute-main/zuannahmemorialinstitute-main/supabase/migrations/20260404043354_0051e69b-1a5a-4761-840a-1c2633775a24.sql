
-- Students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  name text NOT NULL,
  class_level text NOT NULL DEFAULT '1st Grade',
  section text NOT NULL DEFAULT '',
  semester text NOT NULL DEFAULT 'Spring 2024',
  parent_contact text DEFAULT '',
  photo text,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/teacher read students" ON public.students FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students read own record" ON public.students FOR SELECT TO authenticated
  USING (student_id IN (SELECT up.student_id FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.student_id IS NOT NULL));
CREATE POLICY "Parents read linked students" ON public.students FOR SELECT TO authenticated
  USING (student_id IN (SELECT psl.student_id FROM public.parent_student_links psl WHERE psl.parent_user_id = auth.uid()));
CREATE POLICY "Admin/teacher insert students" ON public.students FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin/teacher update students" ON public.students FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin delete students" ON public.students FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Subject grades table
CREATE TABLE public.subject_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  date text NOT NULL DEFAULT '',
  scores jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subject_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/teacher read grades" ON public.subject_grades FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Students read own grades" ON public.subject_grades FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT s.id FROM public.students s
    WHERE s.student_id IN (SELECT up.student_id FROM public.user_profiles up WHERE up.user_id = auth.uid() AND up.student_id IS NOT NULL)
  ));
CREATE POLICY "Parents read linked grades" ON public.subject_grades FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT s.id FROM public.students s
    WHERE s.student_id IN (SELECT psl.student_id FROM public.parent_student_links psl WHERE psl.parent_user_id = auth.uid())
  ));
CREATE POLICY "Admin/teacher insert grades" ON public.subject_grades FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin/teacher update grades" ON public.subject_grades FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin/teacher delete grades" ON public.subject_grades FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher'));

-- Grade components table
CREATE TABLE public.grade_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id text UNIQUE NOT NULL,
  label text NOT NULL,
  max_points integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated read components" ON public.grade_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert components" ON public.grade_components FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update components" ON public.grade_components FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete components" ON public.grade_components FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Grade bands table
CREATE TABLE public.grade_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter text NOT NULL,
  min_val numeric NOT NULL DEFAULT 0,
  max_val numeric NOT NULL DEFAULT 100,
  color text NOT NULL DEFAULT 'gray',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated read bands" ON public.grade_bands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert bands" ON public.grade_bands FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update bands" ON public.grade_bands FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete bands" ON public.grade_bands FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Subjects config table
CREATE TABLE public.subjects_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_levels text[] NOT NULL DEFAULT '{}',
  teacher text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated read subjects config" ON public.subjects_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert subjects config" ON public.subjects_config FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update subjects config" ON public.subjects_config FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete subjects config" ON public.subjects_config FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed default grade components
INSERT INTO public.grade_components (component_id, label, max_points, sort_order) VALUES
  ('attendance', 'Attendance', 10, 1),
  ('classParticipation', 'Class Participation', 5, 2),
  ('tidiness', 'Tidiness', 5, 3),
  ('classWork', 'Eval 1: Class Work', 10, 4),
  ('homeWork', 'Eval 2: Home Work', 10, 5),
  ('project', 'Eval 3: Project', 20, 6),
  ('oralPresentation', 'Eval 4: Oral Presentation', 20, 7),
  ('quiz', 'Eval 5: Quiz', 20, 8);

-- Seed default grade bands
INSERT INTO public.grade_bands (letter, min_val, max_val, color, sort_order) VALUES
  ('A+', 95, 100, 'green', 1),
  ('A', 90, 94.99, 'blue', 2),
  ('A-', 85, 89.99, 'yellow', 3),
  ('B+', 0, 84.99, 'red', 4);

-- Seed sample students
INSERT INTO public.students (id, student_id, name, class_level, section, semester, parent_contact, locked) VALUES
  ('00000000-0000-0000-0000-000000000001', '00-0001', 'Christian Smith', '10th Grade', 'C', 'Spring 2024', '+1 555-0101', false),
  ('00000000-0000-0000-0000-000000000002', '00-0002', 'Maria Johnson', '9th Grade', 'A', 'Spring 2024', '+1 555-0102', false),
  ('00000000-0000-0000-0000-000000000003', '00-0003', 'James Williams', '11th Grade', 'B', 'Spring 2024', '+1 555-0103', true),
  ('00000000-0000-0000-0000-000000000004', '00-0004', 'Sarah Davis', '12th Grade', 'A', 'Spring 2024', '+1 555-0104', false),
  ('00000000-0000-0000-0000-000000000005', '00-0005', 'Robert Brown', 'Kindergarten (KG)', 'C', 'Spring 2024', '+1 555-0105', false);

-- Seed subject grades
INSERT INTO public.subject_grades (student_id, subject, date, scores) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mathematics', '2024-02-09', '{"attendance":10,"classParticipation":5,"tidiness":5,"classWork":9,"homeWork":10,"project":18,"oralPresentation":19,"quiz":20}'),
  ('00000000-0000-0000-0000-000000000001', 'English', '2024-02-10', '{"attendance":9,"classParticipation":4,"tidiness":5,"classWork":10,"homeWork":9,"project":19,"oralPresentation":18,"quiz":19}'),
  ('00000000-0000-0000-0000-000000000001', 'Science', '2024-02-11', '{"attendance":10,"classParticipation":5,"tidiness":4,"classWork":8,"homeWork":10,"project":17,"oralPresentation":20,"quiz":18}'),
  ('00000000-0000-0000-0000-000000000001', 'Social Studies', '2024-02-12', '{"attendance":10,"classParticipation":5,"tidiness":5,"classWork":9,"homeWork":10,"project":18,"oralPresentation":19,"quiz":19}'),
  ('00000000-0000-0000-0000-000000000001', 'General Knowledge', '2024-02-13', '{"attendance":8,"classParticipation":4,"tidiness":5,"classWork":10,"homeWork":9,"project":20,"oralPresentation":18,"quiz":18}'),
  ('00000000-0000-0000-0000-000000000001', 'Latin', '2024-02-14', '{"attendance":9,"classParticipation":5,"tidiness":5,"classWork":9,"homeWork":10,"project":19,"oralPresentation":19,"quiz":20}'),
  ('00000000-0000-0000-0000-000000000002', 'Mathematics', '2024-02-09', '{"attendance":9,"classParticipation":4,"tidiness":4,"classWork":8,"homeWork":9,"project":17,"oralPresentation":16,"quiz":18}'),
  ('00000000-0000-0000-0000-000000000002', 'English', '2024-02-10', '{"attendance":10,"classParticipation":5,"tidiness":5,"classWork":9,"homeWork":10,"project":18,"oralPresentation":19,"quiz":20}'),
  ('00000000-0000-0000-0000-000000000002', 'Science', '2024-02-11', '{"attendance":8,"classParticipation":4,"tidiness":3,"classWork":7,"homeWork":8,"project":15,"oralPresentation":16,"quiz":17}'),
  ('00000000-0000-0000-0000-000000000003', 'Mathematics', '2024-02-09', '{"attendance":7,"classParticipation":3,"tidiness":3,"classWork":6,"homeWork":7,"project":14,"oralPresentation":15,"quiz":15}'),
  ('00000000-0000-0000-0000-000000000003', 'English', '2024-02-10', '{"attendance":8,"classParticipation":4,"tidiness":4,"classWork":7,"homeWork":8,"project":15,"oralPresentation":16,"quiz":16}'),
  ('00000000-0000-0000-0000-000000000004', 'Mathematics', '2024-02-09', '{"attendance":10,"classParticipation":5,"tidiness":5,"classWork":10,"homeWork":10,"project":20,"oralPresentation":20,"quiz":20}'),
  ('00000000-0000-0000-0000-000000000004', 'English', '2024-02-10', '{"attendance":10,"classParticipation":5,"tidiness":5,"classWork":9,"homeWork":10,"project":19,"oralPresentation":19,"quiz":19}'),
  ('00000000-0000-0000-0000-000000000004', 'Science', '2024-02-11', '{"attendance":10,"classParticipation":5,"tidiness":5,"classWork":10,"homeWork":10,"project":18,"oralPresentation":20,"quiz":20}'),
  ('00000000-0000-0000-0000-000000000005', 'Mathematics', '2024-02-09', '{"attendance":7,"classParticipation":3,"tidiness":3,"classWork":6,"homeWork":6,"project":12,"oralPresentation":14,"quiz":14}'),
  ('00000000-0000-0000-0000-000000000005', 'English', '2024-02-10', '{"attendance":6,"classParticipation":3,"tidiness":2,"classWork":5,"homeWork":5,"project":10,"oralPresentation":12,"quiz":13}');

-- Seed subjects config
INSERT INTO public.subjects_config (name, class_levels, teacher) VALUES
  ('Mathematics', ARRAY['Nursery','Kindergarten (KG)','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('English', ARRAY['Nursery','Kindergarten (KG)','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Science', ARRAY['1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Social Studies', ARRAY['1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('General Knowledge', ARRAY['Nursery','Kindergarten (KG)','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade'], NULL),
  ('Latin', ARRAY['7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('History', ARRAY['3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Geography', ARRAY['3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Physical Education', ARRAY['Nursery','Kindergarten (KG)','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Art', ARRAY['Nursery','Kindergarten (KG)','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade'], NULL),
  ('Music', ARRAY['Nursery','Kindergarten (KG)','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade','6th Grade','7th Grade','8th Grade'], NULL),
  ('Computer Science', ARRAY['5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('French', ARRAY['5th Grade','6th Grade','7th Grade','8th Grade','9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Biology', ARRAY['9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Chemistry', ARRAY['9th Grade','10th Grade','11th Grade','12th Grade'], NULL),
  ('Physics', ARRAY['9th Grade','10th Grade','11th Grade','12th Grade'], NULL);
