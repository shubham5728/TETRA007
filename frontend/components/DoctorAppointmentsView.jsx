"use client";

import { useState, useEffect } from "react";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Pill, StatTile } from "@/components/ui";
import { api } from "@/lib/api";

const STATUS_TONE = {
  Confirmed: "mint",
  Pending: "neutral",
  Missed: "neutral",
  Approved: "mint",
  Rejected: "high",
  Rescheduled: "brand",
  Cancelled: "high",
};

export default function DoctorAppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [twinData, setTwinData] = useState(null);
  const [twinLoading, setTwinLoading] = useState(false);

  const fetchAppts = () => {
    setLoading(true);
    api.get("/api/doctor/appointments")
      .then(res => {
        // Merge with locally-saved appointments from fallback booking
        const localAppts = typeof window !== "undefined" 
          ? JSON.parse(localStorage.getItem("aura.local_appointments") || "[]") 
          : [];
        setAppointments([...res, ...localAppts]);
      })
      .catch(() => {
        // If doctor endpoint also missing, just show local appointments
        const localAppts = typeof window !== "undefined" 
          ? JSON.parse(localStorage.getItem("aura.local_appointments") || "[]") 
          : [];
        setAppointments(localAppts);
        if (localAppts.length === 0) setError({ message: "No appointments found" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppts();
  }, []);

  const openRecoveryTwin = async (appt) => {
    setSelectedAppt(appt);
    if (!appt.shared_recovery_twin) return;
    setTwinLoading(true);
    try {
      const data = await api.get(`/api/doctor/appointments/${appt.id}/recovery-twin`);
      setTwinData(data);
    } catch (e) {
      alert("Failed to load twin: " + e.message);
    } finally {
      setTwinLoading(false);
    }
  };

  const handleAction = async (status) => {
    try {
      await api.post(`/api/doctor/appointments/${selectedAppt.id}/status`, { status });
    } catch (e) {
      // Fallback: update in localStorage
      const localAppts = JSON.parse(localStorage.getItem("aura.local_appointments") || "[]");
      const updated = localAppts.map(a => a.id === selectedAppt.id ? { ...a, status } : a);
      localStorage.setItem("aura.local_appointments", JSON.stringify(updated));
    }
    setSelectedAppt(null);
    setTwinData(null);
    fetchAppts();
  };

  if (loading) return <Loading rows={2} />;
  if (error) return <ErrorState error={error} onRetry={fetchAppts} />;

  const pending = appointments.filter(a => a.status === "Pending");
  const upcoming = appointments.filter(a => a.status === "Approved" || a.status === "Confirmed");

  if (selectedAppt) {
    return (
      <Card className="flex flex-col">
        <CardTitle 
          title="Review Appointment Request" 
          eyebrow="Patient Review"
          action={
            <button onClick={() => { setSelectedAppt(null); setTwinData(null); }} className="text-sm font-semibold text-ink-soft hover:text-ink">
              Back to list
            </button>
          } 
        />
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Request Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-ink-soft">Mode</span>
              <span className="font-medium">{selectedAppt.mode}</span>
              <span className="text-ink-soft">Requested Date</span>
              <span className="font-medium">{selectedAppt.scheduled_for}</span>
              <span className="text-ink-soft">Time</span>
              <span className="font-medium">{selectedAppt.time_label}</span>
              <span className="text-ink-soft">Status</span>
              <Pill tone={STATUS_TONE[selectedAppt.status]}>{selectedAppt.status}</Pill>
            </div>
            <div>
              <span className="text-ink-soft text-sm block mb-1">Reason for visit</span>
              <div className="p-3 bg-surface-soft rounded-lg text-sm border">
                {selectedAppt.reason_for_visit || "No reason provided."}
              </div>
            </div>
            
            <div className="pt-4 flex gap-3 flex-wrap">
              {selectedAppt.status === "Pending" && (
                <>
                  <button onClick={() => handleAction("Approved")} className="px-4 py-2 bg-mint text-mint-ink font-semibold rounded-full border border-mint-ink/20 hover:opacity-90">Approve</button>
                  <button onClick={() => handleAction("Rejected")} className="px-4 py-2 bg-risk-high text-white font-semibold rounded-full border border-risk-high hover:opacity-90">Reject</button>
                  <button onClick={() => handleAction("Rescheduled")} className="px-4 py-2 bg-brand text-white font-semibold rounded-full border border-brand hover:opacity-90">Reschedule</button>
                </>
              )}
              {(selectedAppt.status === "Approved" || selectedAppt.status === "Confirmed") && (
                <button className="px-4 py-2 bg-brand text-white font-semibold rounded-full hover:opacity-90 flex items-center gap-2">
                  <Icon name="video" className="size-4" /> Start Teleconsultation
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
              <Icon name="file" className="size-5 text-teal" /> Recovery Twin
            </h3>
            
            {!selectedAppt.shared_recovery_twin ? (
              <div className="p-4 bg-surface-soft rounded-xl text-center text-ink-soft text-sm border">
                Patient did not share a Recovery Twin for this appointment.
              </div>
            ) : twinLoading ? (
              <Loading rows={1} />
            ) : twinData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface-soft rounded-xl border">
                    <p className="text-xs text-ink-soft mb-1">Recovery Score</p>
                    <p className="font-display font-semibold text-2xl">{twinData.recovery_score}%</p>
                  </div>
                  <div className="p-3 bg-surface-soft rounded-xl border">
                    <p className="text-xs text-ink-soft mb-1">Medication Adherence</p>
                    <p className="font-display font-semibold text-2xl">{twinData.medication_adherence}%</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-ink-soft mb-2 uppercase tracking-wide">AI Health Summary</p>
                  <div className="p-3 bg-teal-soft/30 border border-teal/20 rounded-xl text-sm leading-relaxed text-ink font-medium whitespace-pre-wrap">
                    {twinData.ai_health_summary || "No summary available."}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink-soft mb-2 uppercase tracking-wide">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {twinData.symptoms.map(s => (
                      <Pill key={s.name} tone={s.level === "Severe" ? "High" : s.level === "Moderate" ? "Moderate" : "neutral"}>
                        {s.name} ({s.level})
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Pending Requests" value={pending.length} icon="alert" tone="soft" />
        <StatTile label="Upcoming Appointments" value={upcoming.length} icon="calendar" />
        <StatTile label="Completed Today" value={0} icon="check" />
      </div>

      <Card>
        <CardTitle title="Appointment Requests" eyebrow="Needs Action" />
        {pending.length ? (
          <ul className="space-y-3">
            {pending.map(appt => (
              <ApptCard key={appt.id} appt={appt} onOpen={() => openRecoveryTwin(appt)} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No pending requests.</p>
        )}
      </Card>

      <Card>
        <CardTitle title="Upcoming Appointments" eyebrow="Confirmed" />
        {upcoming.length ? (
          <ul className="space-y-3">
            {upcoming.map(appt => (
              <ApptCard key={appt.id} appt={appt} onOpen={() => openRecoveryTwin(appt)} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No upcoming appointments.</p>
        )}
      </Card>
    </div>
  );
}

function ApptCard({ appt, onOpen }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center hover:border-brand/30 hover:bg-surface-soft transition cursor-pointer" onClick={onOpen}>
      <div className="flex w-full items-center gap-4 sm:w-auto sm:flex-1">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${appt.status === "Pending" ? "bg-brand-soft text-brand" : "bg-surface-soft text-ink-soft"}`}>
          <Icon name="calendar" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-ink">{appt.title}</p>
          <p className="truncate text-sm text-ink-soft">
            {appt.reason_for_visit ? appt.reason_for_visit.substring(0, 50) + "..." : "No reason provided"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <Pill><Icon name="calendar" className="size-3.5" />{appt.scheduled_for}</Pill>
        <Pill><Icon name="clock" className="size-3.5" />{appt.time_label}</Pill>
        {appt.shared_recovery_twin && <Pill tone="teal"><Icon name="file" className="size-3.5" /> Twin Shared</Pill>}
        <Pill tone={STATUS_TONE[appt.status] || "neutral"}>{appt.status}</Pill>
      </div>
    </li>
  );
}
