"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@/components/Icons";
import { api } from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
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

  if (!stats) return <div className="p-8 text-secondary">Loading Intelligence Center...</div>;

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">National Health Intelligence Center</h1>
        <p className="text-sm text-secondary">Ministry of Health & Public Welfare</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/40 pb-2">
        {["overview", "map", "schemes", "hospitals", "advisor"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize ${activeTab === tab ? "font-medium text-brand border-b-2 border-brand pb-2 -mb-[10px]" : "text-secondary hover:text-primary"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto pb-8">
        {activeTab === "overview" && <OverviewTab stats={stats} schemes={schemes} />}
        {activeTab === "map" && <MapTab mapData={mapData} />}
        {activeTab === "schemes" && <SchemesTab schemes={schemes} />}
        {activeTab === "hospitals" && <HospitalsTab />}
        {activeTab === "advisor" && <AdvisorTab />}
      </div>
    </div>
  );
}

function HospitalsTab() {
  const [hospitals, setHospitals] = useState([
    { id: 1, name: "City General Hospital", region: "Mumbai, Maharashtra", patients: 12450, abha_verified: 11200, pmjay_claims: 8400, status: "Active" },
    { id: 2, name: "Sanjeevani Care Center", region: "Pune, Maharashtra", patients: 8200, abha_verified: 7900, pmjay_claims: 5200, status: "Active" },
    { id: 3, name: "Apollo Medics", region: "Ahmedabad, Gujarat", patients: 15600, abha_verified: 15000, pmjay_claims: 12100, status: "Active" },
    { id: 4, name: "Surat Trust Hospital", region: "Surat, Gujarat", patients: 6400, abha_verified: 5200, pmjay_claims: 4800, status: "Review Needed" }
  ]);
  
  const [patients, setPatients] = useState([
    { id: "ABHA-8921", name: "Ramesh Kumar", hospital: "City General Hospital", scheme: "PM-JAY", date: "2026-08-01", amount: "₹45,000" },
    { id: "ABHA-1423", name: "Sunita Devi", hospital: "Apollo Medics", scheme: "PM-JAY", date: "2026-07-28", amount: "₹1,20,000" },
    { id: "ABHA-6671", name: "Anil Patel", hospital: "Surat Trust Hospital", scheme: "ABHA Only", date: "2026-07-25", amount: "₹0 (OPD)" }
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Hospitals Accepting National Medical Cards</h3>
          <span className="text-sm text-secondary bg-surface px-3 py-1 rounded-full">Network: 1,245 Active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-secondary">
              <tr>
                <th className="p-3 font-medium rounded-tl-lg">Hospital Name</th>
                <th className="p-3 font-medium">Region</th>
                <th className="p-3 font-medium">Total Card Patients</th>
                <th className="p-3 font-medium">PM-JAY Claims</th>
                <th className="p-3 font-medium rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {hospitals.map(h => (
                <tr key={h.id} className="hover:bg-surface/50">
                  <td className="p-3 font-medium">{h.name}</td>
                  <td className="p-3 text-secondary">{h.region}</td>
                  <td className="p-3">{h.abha_verified.toLocaleString()}</td>
                  <td className="p-3">{h.pmjay_claims.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${h.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Recent Beneficiary Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-secondary">
              <tr>
                <th className="p-3 font-medium rounded-tl-lg">Beneficiary ID</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Hospital</th>
                <th className="p-3 font-medium">Scheme Used</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium rounded-tr-lg">Coverage Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {patients.map((p, i) => (
                <tr key={i} className="hover:bg-surface/50">
                  <td className="p-3 font-medium font-mono text-brand">{p.id}</td>
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 text-secondary">{p.hospital}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${p.scheme === 'PM-JAY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {p.scheme}
                    </span>
                  </td>
                  <td className="p-3 text-secondary">{p.date}</td>
                  <td className="p-3 font-medium">{p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ stats, schemes }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Registered Patients" value={stats.totalRegistered.toLocaleString()} icon="users" color="text-brand" />
        <StatCard title="Active Recovery Cases" value={stats.activeCases.toLocaleString()} icon="activity" color="text-blue-500" />
        <StatCard title="High-Risk Patients" value={stats.highRiskPatients.toLocaleString()} icon="alert" color="text-red-500" />
        <StatCard title="Readmission Rate" value={stats.readmissionRate} icon="chart" color="text-orange-500" />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="PM-JAY Beneficiaries" value={stats.pmjayBeneficiaries.toLocaleString()} icon="heart" color="text-green-500" />
        <StatCard title="Fraud Alerts Detected" value={stats.fraudAlerts} icon="shield" color="text-red-600" />
        <StatCard title="National Health Score" value={`${stats.districtHealthScore}/100`} icon="checkCircle" color="text-teal" />
      </div>

      {schemes && (
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-medium text-secondary">Healthcare Scheme Adoption Trends (Millions)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={schemes.trends}>
                <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="pmjay" stackId="1" stroke="#14b8a6" fill="#14b8a6" name="PM-JAY Usage" />
                <Area type="monotone" dataKey="abha" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="ABHA Cards" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-white p-5 shadow-sm">
      <div className={`rounded-lg bg-surface p-3 ${color}`}>
        <Icon name={icon} className="size-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-secondary">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function MapTab({ mapData }) {
  const [selectedState, setSelectedState] = useState(null);

  if (!mapData) return null;

  return (
    <div className="flex gap-6 h-[600px]">
      <div className="w-1/2 flex flex-col gap-4">
        <h3 className="font-medium text-secondary">National Health Matrix (States)</h3>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2">
          {Object.values(mapData).map((st) => (
            <button
              key={st.name}
              onClick={() => setSelectedState(st)}
              className={`flex items-center justify-between rounded-xl border p-4 text-left shadow-sm transition-colors ${
                selectedState?.name === st.name ? "border-brand bg-brand/5" : "border-border/40 hover:bg-surface"
              }`}
            >
              <div>
                <p className="font-semibold">{st.name}</p>
                <p className="text-xs text-secondary">{st.total_patients} Cases</p>
              </div>
              <div className={`size-3 rounded-full ${st.risk_level === 'Red' ? 'bg-red-500' : st.risk_level === 'Yellow' ? 'bg-yellow-400' : 'bg-green-500'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="w-1/2">
        {selectedState ? (
          <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-1">{selectedState.name} District Intel</h3>
            <p className="text-sm text-secondary mb-6">Showing risk analysis across monitored districts.</p>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {Object.values(selectedState.districts).map((dist) => (
                <div key={dist.name} className="rounded-lg border border-border/40 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{dist.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${dist.recovery_rate < 70 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {dist.recovery_rate}% Recovery
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                    <div>
                      <p className="text-secondary text-xs">Patients</p>
                      <p className="font-medium">{dist.total_patients}</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs">PM-JAY Usage</p>
                      <p className="font-medium">{dist.pmjay_usage}%</p>
                    </div>
                    <div>
                      <p className="text-secondary text-xs">Fraud Alerts</p>
                      <p className={`font-medium ${dist.fraud_cases > 20 ? 'text-red-500' : ''}`}>{dist.fraud_cases}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full rounded-xl border border-dashed border-border/60 flex items-center justify-center text-secondary">
            Select a state to view district-level intelligence.
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
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">ABHA Health Card Verification</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary">Total Beneficiaries</span>
              <span className="font-medium">{schemes.abha.totalBeneficiaries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary">Active Users</span>
              <span className="font-medium text-green-600">{schemes.abha.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-secondary">Pending Verifications</span>
              <span className="font-medium text-orange-500">{schemes.abha.pendingVerifications.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">PM-JAY Scheme Utilization</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary">Total Enrolled</span>
              <span className="font-medium">{schemes.pmjay.totalBeneficiaries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-secondary">Active Claims</span>
              <span className="font-medium text-blue-600">{schemes.pmjay.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-secondary">Suspicious Claims</span>
              <span className="font-medium text-red-500">{schemes.pmjay.pendingVerifications.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-secondary">Fraud Monitoring Center (Monthly Claims)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={schemes.trends}>
              <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f4f4f5' }} />
              <Legend />
              <Bar dataKey="pmjay" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Verified Claims" />
              <Bar dataKey="abha" fill="#ef4444" radius={[4, 4, 0, 0]} name="Flagged for Fraud Review" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
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
      return; // prevent setting loading to false twice
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-border/40 bg-white shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.sender === 'user' 
                ? 'bg-brand text-white' 
                : 'bg-white border border-border/40 text-primary shadow-sm'
            }`}>
              {/* Simple markdown bold parsing for AI */}
              {msg.sender === 'ai' ? (
                <div dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border/40 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
              <div className="size-2 bg-brand/40 rounded-full animate-bounce"></div>
              <div className="size-2 bg-brand/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="size-2 bg-brand rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      <div className="border-t border-border/40 p-4 bg-white">
        <form onSubmit={send} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., Which districts have the highest readmission risk?"
            className="w-full rounded-full border border-border/60 bg-surface px-5 py-3 pr-12 outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 grid size-9 place-items-center rounded-full bg-brand text-white disabled:bg-surface disabled:text-secondary hover:bg-brand/90 transition-colors"
          >
            <Icon name="arrowRight" className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
