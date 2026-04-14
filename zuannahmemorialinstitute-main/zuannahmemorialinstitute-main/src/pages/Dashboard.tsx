import { useMemo, useState } from "react";
import { calcStudentAverage, calcRowPercentage, getLetterGrade, CLASS_LEVELS } from "@/lib/store";
import { getActiveYear } from "@/lib/academicYear";
import { Users, TrendingUp, Award, AlertTriangle, CalendarRange, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useStoreData } from "@/hooks/useStoreData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CHART_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#8b5cf6", "#f97316"];

export default function Dashboard() {
  const { students, components, bands, loading } = useStoreData();
  const activeYear = getActiveYear();

  const [classFilter, setClassFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");

  const semesters = useMemo(() => {
    const set = new Set(students.map((s) => s.semester));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter !== "all" && s.classLevel !== classFilter) return false;
      if (semesterFilter !== "all" && s.semester !== semesterFilter) return false;
      return true;
    });
  }, [students, classFilter, semesterFilter]);

  const stats = useMemo(() => {
    const avgs = filtered.map((s) => ({
      name: s.name,
      avg: calcStudentAverage(s.grades, components),
    }));
    const totalAvg = avgs.length ? avgs.reduce((s, a) => s + a.avg, 0) / avgs.length : 0;
    const passCount = avgs.filter((a) => a.avg >= 85).length;

    const dist: Record<string, number> = {};
    bands.forEach((b) => (dist[b.letter] = 0));
    avgs.forEach((a) => {
      const letter = getLetterGrade(a.avg, bands);
      dist[letter] = (dist[letter] || 0) + 1;
    });

    const subjectMap: Record<string, { total: number; count: number }> = {};
    filtered.forEach((s) =>
      s.grades.forEach((g) => {
        if (!subjectMap[g.subject]) subjectMap[g.subject] = { total: 0, count: 0 };
        subjectMap[g.subject].total += calcRowPercentage(g, components);
        subjectMap[g.subject].count += 1;
      })
    );

    const subjectAvgs = Object.entries(subjectMap).map(([name, d]) => ({
      name: name.length > 12 ? name.slice(0, 12) + "…" : name,
      average: Math.round((d.total / d.count) * 10) / 10,
    }));

    const top5 = [...avgs].sort((a, b) => b.avg - a.avg).slice(0, 5);

    return { totalAvg, passCount, failCount: avgs.length - passCount, dist, subjectAvgs, top5, total: filtered.length };
  }, [filtered, components, bands]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pieData = Object.entries(stats.dist).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Dashboard</h2>
        {activeYear && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <CalendarRange className="w-3.5 h-3.5" />
            {activeYear.name}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters:</span>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASS_LEVELS.map((cl) => (
              <SelectItem key={cl} value={cl}>{cl}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((sem) => (
              <SelectItem key={sem} value={sem}>{sem}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(classFilter !== "all" || semesterFilter !== "all") && (
          <button
            onClick={() => { setClassFilter("all"); setSemesterFilter("all"); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={stats.total} color="text-info" />
        <StatCard icon={TrendingUp} label="Average GPA" value={`${stats.totalAvg.toFixed(1)}%`} color="text-gold" />
        <StatCard icon={Award} label="Passing (≥85%)" value={stats.passCount} color="text-success" />
        <StatCard icon={AlertTriangle} label="Below 85%" value={stats.failCount} color="text-destructive" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Average Score by Subject</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.subjectAvgs}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="average" fill="hsl(43, 55%, 54%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="stat-card">
        <h3 className="font-display font-semibold mb-3">🏆 Top 5 Performing Students</h3>
        <div className="divide-y divide-border">
          {stats.top5.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between py-2">
              <span className="font-medium">
                <span className="text-gold font-bold mr-2">#{i + 1}</span>
                {s.name}
              </span>
              <span className="font-semibold text-gold">{s.avg.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-muted ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold font-display">{value}</p>
      </div>
    </div>
  );
}
