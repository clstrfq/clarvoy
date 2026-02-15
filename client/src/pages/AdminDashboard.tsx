import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, ZAxis } from "recharts";
import { AlertTriangle, Activity, Database } from "lucide-react";

// Mock Data for Visualization since no real endpoints exist yet
const heatmapData = [
  { x: "Strategy", y: "Sunk Cost", z: 80 },
  { x: "Hiring", y: "Halo Effect", z: 40 },
  { x: "Product", y: "Confirmation", z: 90 },
  { x: "Finance", y: "Anchoring", z: 65 },
  { x: "Strategy", y: "Groupthink", z: 30 },
  { x: "Hiring", y: "Affinity", z: 75 },
  { x: "Product", y: "Optimism", z: 50 },
  { x: "Finance", y: "Loss Aversion", z: 85 },
];

const mockLogs = [
  { id: 1, action: "JUDGMENT_SUBMITTED", user: "User_8a2d", time: "2 mins ago", details: "Blind input sealed for Case #1042" },
  { id: 2, action: "DECISION_CREATED", user: "User_9b3c", time: "1 hour ago", details: "New case 'Q4 Budget' initiated" },
  { id: 3, action: "CONSENSUS_REACHED", user: "System", time: "3 hours ago", details: "Case #1039 auto-closed" },
  { id: 4, action: "BIAS_ALERT", user: "Clarvoy", time: "5 hours ago", details: "High variance detected in Hiring Committee" },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="mb-10">
          <h1 className="text-3xl font-display font-bold text-white mb-2">System Analytics</h1>
          <p className="text-muted-foreground">Monitor organizational epistemic health and audit trails.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bias Heatmap */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Organizational Bias Heatmap
              </CardTitle>
              <CardDescription>Frequency of detected bias patterns by decision category.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="category" dataKey="x" name="Category" stroke="#52525b" />
                    <YAxis type="category" dataKey="y" name="Bias Type" stroke="#52525b" />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Severity" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Scatter name="Bias Severity" data={heatmapData} fill="hsl(var(--primary))" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                System Audit Log
              </CardTitle>
              <CardDescription>Immutable record of all governance actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="mt-1">
                      {log.action === "BIAS_ALERT" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-white">{log.action}</p>
                        <span className="text-xs text-muted-foreground">{log.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      <p className="text-[10px] text-white/30 font-mono mt-1 uppercase">{log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
