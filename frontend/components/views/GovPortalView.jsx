"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill } from "@/components/ui";
import { api } from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area 
} from "recharts";

export default function GovPortalView() {
  const [stats, setStats] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [schemes, setSchemes] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function load() {
      try {
        const [st, mapD, sch] = await Promise.all([
          api.get("/api/gov/dashboard"),
          api.get("/api/gov/map-data"),
          api.get("/api/gov/schemes"),
        ]);
        setStats(st);
        setMapData(mapD.states);
        setSchemes(sch);
      } catch (err) {
        console.warn("Backend unavailable, using mock data for demonstration", err);
        setStats({
          totalRegistered: 1450000,
          activeCases: 23500,
          highRiskPatients: 1450,
          readmissionRate: "12%",
          pmjayBeneficiaries: 1087500,
          fraudAlerts: 342,
          districtHealthScore: 84
        });
        setMapData({
          "Maharashtra": {
            name: "Maharashtra",
            total_patients: 450000,
            risk_level: "Yellow",
            districts: {
              "Mumbai": { name: "Mumbai", total_patients: 210000, recovery_rate: 82, fraud_cases: 45, pmjay_usage: 65 },
              "Pune": { name: "Pune", total_patients: 150000, recovery_rate: 88, fraud_cases: 12, pmjay_usage: 72 }
            }
          },
          "Gujarat": {
            name: "Gujarat",
            total_patients: 320000,
            risk_level: "Green",
            districts: {
              "Ahmedabad": { name: "Ahmedabad", total_patients: 180000, recovery_rate: 91, fraud_cases: 8, pmjay_usage: 81 },
              "Surat": { name: "Surat", total_patients: 140000, recovery_rate: 85, fraud_cases: 24, pmjay_usage: 76 }
            }
          }
        });
        setSchemes({
          abha: { totalBeneficiaries: 1450000, activeUsers: 980000, pendingVerifications: 12500 },
          pmjay: { totalBeneficiaries: 890000, activeUsers: 640000, pendingVerifications: 8400 },
          trends: [
            { month: "Jan", abha: 100, pmjay: 80 },
            { month: "Feb", abha: 120, pmjay: 90 },
            { month: "Mar", abha: 140, pmjay: 110 },
            { month: "Apr", abha: 160, pmjay: 125 },
            { month: "May", abha: 190, pmjay: 150 }
          ]
        });
      }
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-ink-soft">
        <div className="flex items-center gap-3">
          <div className="size-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span className="font-semibold">Loading National Health Intelligence Center...</span>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: "chart" },
    { id: "map", label: "District Matrix", icon: "activity" },
    { id: "schemes", label: "Scheme Analytics", icon: "shield" },
    { id: "hospitals", label: "Hospitals & Claims", icon: "hospital" },
    { id: "advisor", label: "AI Policy Advisor", icon: "brain" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <Card className="bg-gradient-to-br from-surface via-surface-soft to-brand-soft/20 border border-line">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow>MINISTRY OF HEALTH & PUBLIC WELFARE</Eyebrow>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
              National Health Intelligence Center
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Real-time epidemiological monitoring, ABHA card verification, and PM-JAY scheme oversight.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Pill tone="brand" className="px-3.5 py-1.5 font-bold shadow-sm">
              ● Live Intelligence Feed
            </Pill>
            <Pill tone="neutral" className="px-3.5 py-1.5 font-semibold">
              ABHA & PM-JAY Monitored
            </Pill>
          </div>
        </div>
      </Card>

      {/* Pill-Style Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl border border-line bg-surface-soft shadow-inner scrollbar-none">
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                isActive
                  ? "bg-brand text-white shadow-md shadow-brand/20 scale-[1.01]"
                  : "text-ink-soft hover:text-ink hover:bg-surface/80"
              }`}
            >
              <Icon name={t.icon} className={`size-4 ${isActive ? "text-white" : "text-ink-soft"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace Content Views */}
      <div className="space-y-6">
        {activeTab === "overview" && <OverviewTab stats={stats} schemes={schemes} />}
        {activeTab === "map" && <MapTab mapData={mapData} />}
        {activeTab === "schemes" && <SchemesTab schemes={schemes} />}
        {activeTab === "hospitals" && <HospitalsTab />}
        {activeTab === "advisor" && <AdvisorTab />}
      </div>
    </div>
  );
}

function StatTile({ title, value, icon, tone = "brand", subtitle }) {
  const toneMap = {
    brand: "bg-brand/10 text-brand border-brand/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    teal: "bg-teal/10 text-teal border-teal/20",
  };

  return (
    <Card className="hover:border-line-hover transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{title}</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-ink-soft font-medium">{subtitle}</p>}
        </div>
        <div className={`grid size-11 place-items-center rounded-2xl border ${toneMap[tone] || toneMap.brand}`}>
          <Icon name={icon} className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function OverviewTab({ stats, schemes }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile title="Total Registered Patients" value={stats.totalRegistered.toLocaleString()} icon="users" tone="brand" subtitle="National ABHA Database" />
        <StatTile title="Active Recovery Cases" value={stats.activeCases.toLocaleString()} icon="activity" tone="blue" subtitle="Under telemetry tracking" />
        <StatTile title="High-Risk Patients" value={stats.highRiskPatients.toLocaleString()} icon="alert" tone="red" subtitle="Sentinel Sentinel-flagged" />
        <StatTile title="Readmission Rate" value={stats.readmissionRate} icon="chart" tone="amber" subtitle="30-day post-discharge benchmark" />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile title="PM-JAY Beneficiaries" value={stats.pmjayBeneficiaries.toLocaleString()} icon="heart" tone="emerald" subtitle="Active insurance coverage" />
        <StatTile title="Fraud Alerts Detected" value={stats.fraudAlerts} icon="shield" tone="red" subtitle="AI claims verification flag" />
        <StatTile title="National Health Score" value={`${stats.districtHealthScore}/100`} icon="checkCircle" tone="teal" subtitle="Weighted state average" />
      </div>

      {schemes && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <CardTitle>Healthcare Scheme Adoption Trends</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">Monthly active enrollment comparison (Millions)</p>
            </div>
            <Pill tone="brand">Realtime Graph</Pill>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={schemes.trends}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", borderColor: "#e2e9f3", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Area type="monotone" dataKey="pmjay" stackId="1" stroke="#1665d8" fill="#1665d8" fillOpacity={0.7} name="PM-JAY Usage" />
                <Area type="monotone" dataKey="abha" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.5} name="ABHA Cards" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function MapTab({ mapData }) {
  const [selectedState, setSelectedState] = useState(null);

  if (!mapData) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* State List Panel */}
      <div className="space-y-3 lg:col-span-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">National Health Matrix (States)</h3>
        <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
          {Object.values(mapData).map((st) => {
            const isSelected = selectedState?.name === st.name;
            return (
              <button
                key={st.name}
                onClick={() => setSelectedState(st)}
                className={`w-full flex items-center justify-between rounded-2xl border p-4 text-left shadow-sm transition-all ${
                  isSelected
                    ? "border-brand bg-brand-soft/40 ring-1 ring-brand/30"
                    : "border-line bg-surface hover:bg-surface-soft"
                }`}
              >
                <div>
                  <p className="font-bold text-ink">{st.name}</p>
                  <p className="text-xs text-ink-soft font-medium">{st.total_patients.toLocaleString()} Registered Cases</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    st.risk_level === 'Red' ? 'bg-red-500/15 text-red-600 border border-red-500/20' : 
                    st.risk_level === 'Yellow' ? 'bg-amber-500/15 text-amber-600 border border-amber-500/20' : 
                    'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                  }`}>
                    {st.risk_level} Risk
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* District Intelligence Panel */}
      <div className="lg:col-span-7">
        {selectedState ? (
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div>
                <CardTitle>{selectedState.name} District Intelligence</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">District-level risk analysis & PM-JAY utilization</p>
              </div>
              <Pill tone="brand">{Object.keys(selectedState.districts).length} Districts</Pill>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {Object.values(selectedState.districts).map((dist) => (
                <div key={dist.name} className="rounded-2xl border border-line bg-surface-soft/60 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-ink text-base">{dist.name}</h4>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      dist.recovery_rate < 85 ? 'bg-amber-500/15 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {dist.recovery_rate}% Recovery Rate
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-line/60">
                    <div>
                      <p className="text-ink-soft font-semibold">Patients</p>
                      <p className="font-bold text-ink text-sm mt-0.5">{dist.total_patients.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-ink-soft font-semibold">PM-JAY Usage</p>
                      <p className="font-bold text-brand text-sm mt-0.5">{dist.pmjay_usage}%</p>
                    </div>
                    <div>
                      <p className="text-ink-soft font-semibold">Fraud Alerts</p>
                      <p className={`font-bold text-sm mt-0.5 ${dist.fraud_cases > 20 ? 'text-red-600' : 'text-ink'}`}>{dist.fraud_cases}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="h-full min-h-[300px] rounded-3xl border border-dashed border-line bg-surface/50 flex items-center justify-center p-6 text-center text-ink-soft font-medium">
            Select a state from the matrix list to inspect district-level health intelligence.
          </div>
        )}
      </div>
    </div>
  );
}

function SchemesTab({ schemes }) {
  if (!schemes) return null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>ABHA Health Card Verification</CardTitle>
            <Pill tone="brand">National ID</Pill>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-line pb-2.5 text-sm">
              <span className="text-ink-soft font-medium">Total Beneficiaries</span>
              <span className="font-bold text-ink">{schemes.abha.totalBeneficiaries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5 text-sm">
              <span className="text-ink-soft font-medium">Active Users</span>
              <span className="font-bold text-emerald-600">{schemes.abha.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft font-medium">Pending Verifications</span>
              <span className="font-bold text-amber-600">{schemes.abha.pendingVerifications.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>PM-JAY Scheme Utilization</CardTitle>
            <Pill tone="neutral">Public Insurance</Pill>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-line pb-2.5 text-sm">
              <span className="text-ink-soft font-medium">Total Enrolled</span>
              <span className="font-bold text-ink">{schemes.pmjay.totalBeneficiaries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5 text-sm">
              <span className="text-ink-soft font-medium">Active Claims</span>
              <span className="font-bold text-brand">{schemes.pmjay.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft font-medium">Suspicious Claims Flagged</span>
              <span className="font-bold text-red-600">{schemes.pmjay.pendingVerifications.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <CardTitle>Fraud Monitoring Center (Claims Audit)</CardTitle>
            <p className="mt-0.5 text-xs text-ink-soft">Verified vs flagged medical claims breakdown</p>
          </div>
          <Pill tone="brand">AI Sentinel Audit</Pill>
        </div>
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={schemes.trends}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", borderColor: "#e2e9f3" }} cursor={{ fill: "#f1f5f9" }} />
              <Legend />
              <Bar dataKey="pmjay" fill="#1665d8" radius={[6, 6, 0, 0]} name="Verified Claims" />
              <Bar dataKey="abha" fill="#ef4444" radius={[6, 6, 0, 0]} name="Flagged for Fraud Review" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function HospitalsTab() {
  const [hospitals] = useState([
    { id: 1, name: "City General Hospital", region: "Mumbai, Maharashtra", patients: 12450, abha_verified: 11200, pmjay_claims: 8400, status: "Active" },
    { id: 2, name: "Sanjeevani Care Center", region: "Pune, Maharashtra", patients: 8200, abha_verified: 7900, pmjay_claims: 5200, status: "Active" },
    { id: 3, name: "Apollo Medics", region: "Ahmedabad, Gujarat", patients: 15600, abha_verified: 15000, pmjay_claims: 12100, status: "Active" },
    { id: 4, name: "Surat Trust Hospital", region: "Surat, Gujarat", patients: 6400, abha_verified: 5200, pmjay_claims: 4800, status: "Review Needed" }
  ]);
  
  const [patients] = useState([
    { id: "ABHA-8921", name: "Ramesh Kumar", hospital: "City General Hospital", scheme: "PM-JAY", date: "2026-08-01", amount: "₹45,000" },
    { id: "ABHA-1423", name: "Sunita Devi", hospital: "Apollo Medics", scheme: "PM-JAY", date: "2026-07-28", amount: "₹1,20,000" },
    { id: "ABHA-6671", name: "Anil Patel", hospital: "Surat Trust Hospital", scheme: "ABHA Only", date: "2026-07-25", amount: "₹0 (OPD)" }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <CardTitle>Hospitals Accepting National Medical Cards</CardTitle>
            <p className="mt-0.5 text-xs text-ink-soft">Verified empirical health providers & claim status</p>
          </div>
          <Pill tone="brand">Network: 1,245 Active</Pill>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas/60 text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-line">
              <tr>
                <th className="p-3.5">Hospital Name</th>
                <th className="p-3.5">Region</th>
                <th className="p-3.5">Total Card Patients</th>
                <th className="p-3.5">PM-JAY Claims</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-surface">
              {hospitals.map(h => (
                <tr key={h.id} className="hover:bg-surface-soft transition-colors">
                  <td className="p-3.5 font-bold text-ink">{h.name}</td>
                  <td className="p-3.5 text-ink-soft font-medium">{h.region}</td>
                  <td className="p-3.5 font-bold text-ink">{h.abha_verified.toLocaleString()}</td>
                  <td className="p-3.5 font-bold text-brand">{h.pmjay_claims.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${h.status === 'Active' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/15 text-red-600 border border-red-500/20'}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <CardTitle>Recent Beneficiary Transactions</CardTitle>
            <p className="mt-0.5 text-xs text-ink-soft">Live claims & patient coverage logs</p>
          </div>
          <Pill tone="neutral">Audited Ledger</Pill>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas/60 text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-line">
              <tr>
                <th className="p-3.5">Beneficiary ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Hospital</th>
                <th className="p-3.5">Scheme Used</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Coverage Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 bg-surface">
              {patients.map((p, i) => (
                <tr key={i} className="hover:bg-surface-soft transition-colors">
                  <td className="p-3.5 font-mono font-bold text-brand">{p.id}</td>
                  <td className="p-3.5 font-bold text-ink">{p.name}</td>
                  <td className="p-3.5 text-ink-soft font-medium">{p.hospital}</td>
                  <td className="p-3.5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${p.scheme === 'PM-JAY' ? 'bg-blue-500/15 text-blue-600 border border-blue-500/20' : 'bg-purple-500/15 text-purple-600 border border-purple-500/20'}`}>
                      {p.scheme}
                    </span>
                  </td>
                  <td className="p-3.5 text-ink-soft font-medium">{p.date}</td>
                  <td className="p-3.5 font-bold text-ink">{p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AdvisorTab() {
  const [messages, setMessages] = useState([{
    sender: 'ai', 
    text: "I am the AURA Policy Advisor. I can analyze healthcare data, suggest policy improvements, predict demand, and identify underserved regions. How can I assist the Ministry today?"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);
    
    try {
      const res = await api.post("/api/gov/advisor", { query: userMsg });
      setMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      console.warn("Backend unavailable, using mock advisor response");
      setTimeout(() => {
        const lower = userMsg.toLowerCase();
        let reply = "I have analyzed the national health index for your query. Overall, healthcare accessibility is improving, but rural coverage remains a challenge in central districts. Would you like a detailed CSV report?";
        if (lower.includes("abha")) {
          reply = "Based on the latest data, the districts with the lowest ABHA adoption are **Thane (42%)**, **Kozhikode (45%)**, and **Agra (47%)**. I recommend initiating targeted awareness campaigns via local ASHA workers in these regions.";
        } else if (lower.includes("readmission")) {
          reply = "**Bengaluru Rural** and **Ahmedabad** show the highest readmission risks (above 18%), primarily due to missed post-operative follow-ups. Introducing automated IVR calls for patient follow-up compliance could reduce this risk.";
        } else if (lower.includes("fraud")) {
          reply = "I've detected a cluster of suspicious PM-JAY claims in **Surat** (14 duplicate identities flagged this week). You may want to dispatch a field verification team to the top 3 offending hospitals.";
        }
        setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
        setLoading(false);
      }, 800);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] p-0 overflow-hidden border border-line">
      <div className="p-4 border-b border-line bg-surface-soft/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-brand to-cyan-500 text-white font-bold">
            A
          </div>
          <div>
            <h3 className="font-bold text-ink text-sm">AURA National Policy Advisor</h3>
            <p className="text-xs text-emerald-600 font-semibold">● Ministry AI Assistant Active</p>
          </div>
        </div>
        <Pill tone="brand">LLM Scoped</Pill>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-canvas/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-brand to-brand-deep text-white font-medium shadow-sm' 
                : 'bg-surface border border-line text-ink font-medium shadow-sm'
            }`}>
              {msg.sender === 'ai' ? (
                <div dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-brand">$1</strong>')}} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-line rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
              <div className="size-2 bg-brand/40 rounded-full animate-bounce"></div>
              <div className="size-2 bg-brand/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="size-2 bg-brand rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      <div className="border-t border-line p-4 bg-surface">
        <form onSubmit={send} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI policy insights (e.g. Which districts have highest readmission risk?)"
            className="w-full rounded-full border border-line bg-surface-soft px-5 py-3 pr-12 text-sm text-ink font-medium outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 grid size-9 place-items-center rounded-full bg-brand text-white disabled:opacity-40 hover:bg-brand-deep transition-all shadow-sm"
          >
            <Icon name="arrowRight" className="size-5" />
          </button>
        </form>
      </div>
    </Card>
  );
}

