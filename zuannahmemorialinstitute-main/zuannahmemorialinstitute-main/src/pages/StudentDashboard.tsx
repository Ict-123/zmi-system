import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calcStudentAverage, calcRowTotal, calcMaxTotal, getLetterGrade } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, GraduationCap } from "lucide-react";
import { exportStudentPDF } from "@/lib/pdfExport";
import zuannahLogo from "@/assets/zuannah_logo.jpeg";
import { useStoreData } from "@/hooks/useStoreData";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { students, components, bands, loading: storeLoading } = useStoreData();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("student_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setStudentId(data?.student_id || null);
      setProfileLoading(false);
    }
    fetchProfile();
  }, [user]);

  const loading = storeLoading || profileLoading;

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const student = students.find((s) => s.studentId === studentId);

  if (!studentId || !student) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          My Grades
        </h2>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Your account has not been linked to a student record yet.</p>
            <p className="text-sm mt-2">Please contact the school administrator to link your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallAvg = calcStudentAverage(student.grades, components);
  const letterGrade = getLetterGrade(overallAvg, bands);
  const maxTotal = calcMaxTotal(components);

  const getMidtermScore = (g: any) => {
    const mid = Math.ceil(components.length / 2);
    return components.slice(0, mid).reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
  };

  const getFinalExamScore = (g: any) => {
    const mid = Math.ceil(components.length / 2);
    return components.slice(mid).reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          My Report Card
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => exportStudentPDF(student, components, bands)}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grade-sheet-print bg-white border-[3px] border-[hsl(var(--brown))] rounded-lg max-w-[700px] mx-auto shadow-lg">
        <div className="border-[2px] border-[hsl(var(--primary))] m-2 p-6">
          <div className="flex items-center gap-4 mb-2">
            <img src={zuannahLogo} alt="ZMI Logo" className="w-20 h-20 rounded-full object-contain" />
            <div>
              <h1 className="text-2xl font-display font-bold text-[hsl(var(--brown))]">Zuannah Memorial Institute</h1>
              <p className="text-sm text-muted-foreground">Monrovia, Liberia</p>
            </div>
          </div>
          <div className="border-b-2 border-[hsl(var(--primary))] mb-4" />
          <h2 className="text-center text-lg font-display font-bold mb-4 text-[hsl(var(--brown))]">STUDENT REPORT CARD</h2>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4">
            <div><span className="font-semibold">Student Name:</span> {student.name}</div>
            <div><span className="font-semibold">Student ID:</span> {student.studentId}</div>
            <div><span className="font-semibold">Grade/Class:</span> {student.classLevel}</div>
            <div><span className="font-semibold">Section:</span> {student.section}</div>
          </div>

          <table className="w-full border-collapse text-sm mb-4">
            <thead>
              <tr className="bg-[hsl(var(--brown))] text-white">
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-left">#</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-left">Subject</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-center">Midterm</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-center">Final Exam</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-center">Total</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-center">Average (%)</th>
                <th className="border border-[hsl(var(--brown))] px-2 py-1.5 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.grades.map((g, i) => {
                const midterm = getMidtermScore(g);
                const final_ = getFinalExamScore(g);
                const total = calcRowTotal(g, components);
                const pct = ((total / maxTotal) * 100);
                const grade = getLetterGrade(pct, bands);
                return (
                  <tr key={g.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1 font-medium">{g.subject}</td>
                    <td className="border px-2 py-1 text-center">{midterm}</td>
                    <td className="border px-2 py-1 text-center">{final_}</td>
                    <td className="border px-2 py-1 text-center font-semibold">{total}</td>
                    <td className="border px-2 py-1 text-center">{pct.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-center font-bold">{grade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between text-sm font-semibold bg-[hsl(var(--brown))]/10 px-3 py-2 rounded">
            <span>Overall Average: {overallAvg.toFixed(1)}%</span>
            <span>Overall Grade: {letterGrade}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
