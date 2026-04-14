import { useState, useEffect } from "react";
import { GradeComponent, GradeBand } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/useStoreData";

export default function SettingsPage() {
  const { components: dbComponents, bands: dbBands, saveComponents: saveComponentsDb, saveBands: saveBandsDb, loading } = useStoreData();
  const [components, setComponents] = useState<GradeComponent[]>([]);
  const [bands, setB] = useState<GradeBand[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setComponents(dbComponents);
      setB(dbBands);
    }
  }, [loading, dbComponents, dbBands]);

  const total = components.reduce((sum, c) => sum + c.maxPoints, 0);

  function addComponent() {
    setComponents([...components, { id: crypto.randomUUID(), label: "", maxPoints: 0 }]);
  }

  function removeComponent(id: string) {
    setComponents(components.filter((c) => c.id !== id));
  }

  function updateComponent(id: string, field: keyof GradeComponent, value: string | number) {
    setComponents(components.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function saveComponentsHandler() {
    const hasEmpty = components.some((c) => !c.label.trim());
    if (hasEmpty) {
      toast({ title: "All components must have a name", variant: "destructive" });
      return;
    }
    if (total === 0) {
      toast({ title: "Total points must be greater than 0", variant: "destructive" });
      return;
    }
    await saveComponentsDb(components);
    toast({ title: "Grade components saved!" });
  }

  async function saveBands() {
    await saveBandsDb(bands);
    toast({ title: "Grade bands saved!" });
  }

  function addBand() {
    setB([...bands, { letter: "", min: 0, max: 0, color: "gray" }]);
  }

  function removeBand(i: number) {
    setB(bands.filter((_, idx) => idx !== i));
  }

  function updateBand(i: number, field: keyof GradeBand, value: string | number) {
    setB(bands.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));
  }

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h2 className="text-2xl font-display font-bold">Settings</h2>

      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Grade Components</h3>
          <Button variant="outline" size="sm" onClick={addComponent} className="gap-1">
            <Plus className="w-3 h-3" /> Add Component
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Define your grading components. Each component has a name and maximum points.
        </p>
        <div className="space-y-2">
          {components.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Input
                value={c.label}
                onChange={(e) => updateComponent(c.id, "label", e.target.value)}
                placeholder="Component name (e.g. Attendance)"
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                value={c.maxPoints}
                onChange={(e) => updateComponent(c.id, "maxPoints", Number(e.target.value))}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">pts</span>
              <Button variant="ghost" size="icon" onClick={() => removeComponent(c.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {components.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No components defined. Click "Add Component" to create one.
            </p>
          )}
        </div>
        <div className={`text-sm font-semibold ${total > 0 ? "text-success" : "text-destructive"}`}>
          Total: {total} pts
        </div>
        <Button onClick={saveComponentsHandler} className="gap-1">
          <Save className="w-4 h-4" /> Save Components
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-4">
        <h3 className="font-display font-semibold text-lg">Grade Bands</h3>
        <div className="space-y-2">
          {bands.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={b.letter} onChange={(e) => updateBand(i, "letter", e.target.value)} placeholder="Letter" className="w-20" />
              <Input type="number" value={b.min} onChange={(e) => updateBand(i, "min", Number(e.target.value))} placeholder="Min" className="w-20" />
              <span className="text-muted-foreground">–</span>
              <Input type="number" value={b.max} onChange={(e) => updateBand(i, "max", Number(e.target.value))} placeholder="Max" className="w-20" />
              <span className="text-sm text-muted-foreground">%</span>
              <Button variant="ghost" size="icon" onClick={() => removeBand(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addBand} className="gap-1"><Plus className="w-3 h-3" /> Add Band</Button>
          <Button size="sm" onClick={saveBands} className="gap-1"><Save className="w-3 h-3" /> Save Bands</Button>
        </div>
      </div>
    </div>
  );
}
