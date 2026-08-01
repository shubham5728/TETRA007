"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Pill } from "@/components/ui";
import { api } from "@/lib/api";

const AVAILABLE_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"
];

const FALLBACK_DOCTORS = [
  { id: 1, name: "Dr. Rajesh Patel", specialization: "Cardiologist", hospital: "Apollo Hospital Ahmedabad", experience_years: 15, rating: 4.9, fee: 1200, languages: "English, Hindi, Gujarati" },
  { id: 2, name: "Dr. Priya Shah", specialization: "General Physician", hospital: "Sterling Hospital", experience_years: 10, rating: 4.7, fee: 800, languages: "English, Hindi, Gujarati" },
  { id: 3, name: "Dr. Amit Mehta", specialization: "Neurologist", hospital: "Zydus Hospital", experience_years: 12, rating: 4.8, fee: 1500, languages: "English, Hindi, Gujarati" },
  { id: 4, name: "Dr. Neha Joshi", specialization: "Endocrinologist", hospital: "HCG Hospital", experience_years: 8, rating: 4.6, fee: 1000, languages: "English, Hindi" },
  { id: 5, name: "Dr. Karan Desai", specialization: "Orthopedic Surgeon", hospital: "Civil Hospital Ahmedabad", experience_years: 14, rating: 4.5, fee: 600, languages: "English, Hindi, Gujarati" },
];

export default function BookAppointmentFlow({ patient, onBooked, onCancel }) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [shareTwin, setShareTwin] = useState(true);
  const [mode, setMode] = useState("In person");

  // Fetch doctors and recommendation on mount — falls back to hardcoded list
  useEffect(() => {
    let mounted = true;
    setDoctorsLoading(true);
    setDoctorsError(null);
    api.get("/api/patient/doctors")
      .then(res => {
        if (mounted) setDoctors(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        // Backend endpoint not deployed yet — use built-in doctor list
        if (mounted) {
          setDoctors(FALLBACK_DOCTORS);
          setUsingFallback(true);
        }
      })
      .finally(() => {
        if (mounted) setDoctorsLoading(false);
      });
    api.get("/api/patient/doctors/recommend").then(res => mounted && setRecommended(res)).catch(() => {});
    return () => (mounted = false);
  }, []);

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.specialization.toLowerCase().includes(search.toLowerCase()) || 
    d.hospital.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDoctor.id) {
      alert("Please select a doctor before submitting.");
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      // Try real API first
      await api.post("/api/patient/appointments/book", {
        doctor_id: selectedDoctor.id,
        mode: mode,
        scheduled_for: selectedDate,
        time_label: selectedSlot,
        reason_for_visit: reason,
        shared_recovery_twin: shareTwin
      });
      onBooked();
    } catch (e) {
      // If backend booking endpoint is also missing (404), save locally
      if (e.status === 404 || usingFallback) {
        const localAppts = JSON.parse(localStorage.getItem("aura.local_appointments") || "[]");
        localAppts.push({
          id: Date.now(),
          title: `${selectedDoctor.specialization} Consultation`,
          doctor: selectedDoctor.name,
          doctor_id: selectedDoctor.id,
          mode: mode,
          scheduled_for: selectedDate,
          time_label: selectedSlot,
          status: "Pending",
          reason_for_visit: reason,
          shared_recovery_twin: shareTwin,
          patient_name: patient?.name || "Patient",
        });
        localStorage.setItem("aura.local_appointments", JSON.stringify(localAppts));
        onBooked();
      } else {
        alert("Failed to book: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[70vh] overflow-hidden">
      <CardTitle title="Book Appointment" hint={`Step ${step} of 6`} action={
        <button onClick={onCancel} className="text-sm font-semibold text-ink-soft hover:text-ink">Cancel</button>
      } />

      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Search Doctor</label>
              <input 
                type="text" 
                className="w-full rounded-xl border p-3 outline-none focus:border-brand"
                placeholder="Search by name, specialization, or hospital..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            {recommended && !search && (
              <div className="rounded-xl border border-brand/20 bg-brand-soft/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="sparkles" className="size-4 text-brand" />
                  <span className="text-sm font-semibold text-brand">AI Recommended for {patient?.diagnosis}</span>
                </div>
                <DoctorCard doc={recommended} onSelect={() => { setSelectedDoctor(recommended); setStep(2); }} />
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink-soft">Available Doctors</p>
              {doctorsLoading && (
                <p className="text-sm text-ink-soft py-4 text-center">Loading doctors...</p>
              )}
              {doctorsError && (
                <div className="text-sm text-risk-high py-4 text-center">
                  <p>Failed to load doctors: {doctorsError}</p>
                  <p className="text-xs mt-1">Make sure the backend server is running.</p>
                </div>
              )}
              {!doctorsLoading && !doctorsError && filteredDoctors.length === 0 && (
                <p className="text-sm text-ink-soft py-4 text-center">No doctors found.</p>
              )}
              {filteredDoctors.map(doc => (
                <DoctorCard key={doc.id} doc={doc} onSelect={() => { setSelectedDoctor(doc); setStep(2); }} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Select Date & Mode</h3>
            <div className="rounded-xl border p-4 bg-surface-soft mb-6">
              <p className="font-semibold">{selectedDoctor?.name}</p>
              <p className="text-sm text-ink-soft">{selectedDoctor?.specialization}</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Consultation Mode</label>
              <div className="flex gap-3">
                {["In person", "Video call", "Phone call"].map(m => (
                  <button 
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 rounded-xl border font-medium ${mode === m ? "border-brand bg-brand-soft/50 text-brand" : "hover:bg-surface-soft"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Date</label>
              <input 
                type="date" 
                className="w-full rounded-xl border p-3 outline-none focus:border-brand"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Select Available Time Slot</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AVAILABLE_SLOTS.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-3 rounded-xl border text-center font-medium ${selectedSlot === slot ? "border-brand bg-brand text-white" : "hover:border-brand hover:text-brand"}`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Reason For Visit</h3>
            <textarea
              rows={4}
              className="w-full rounded-xl border p-3 outline-none focus:border-brand"
              placeholder="Briefly describe your symptoms or reason for visit..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Share Recovery Twin</h3>
            <div className="rounded-xl border p-5 bg-surface-soft space-y-4">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-soft text-teal">
                  <Icon name="file" className="size-6" />
                </div>
                <div>
                  <p className="font-semibold">AI Recovery Twin Report</p>
                  <p className="text-sm text-ink-soft">Share your recent symptoms, vitals, and medication adherence with {selectedDoctor?.name} for better care.</p>
                </div>
              </div>
              
              <div className="pt-4 border-t flex gap-4">
                <button 
                  onClick={() => setShareTwin(true)}
                  className={`flex-1 py-2 rounded-lg font-semibold border ${shareTwin ? "bg-teal text-white border-teal" : "bg-white text-ink hover:bg-surface-soft"}`}
                >
                  Yes, share it
                </button>
                <button 
                  onClick={() => setShareTwin(false)}
                  className={`flex-1 py-2 rounded-lg font-semibold border ${!shareTwin ? "bg-ink text-white border-ink" : "bg-white text-ink hover:bg-surface-soft"}`}
                >
                  No, thanks
                </button>
              </div>
            </div>
          </div>
        )}
        
        {step === 6 && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Review Request</h3>
            <div className="rounded-2xl border p-5 space-y-4">
              <div className="flex justify-between border-b pb-4">
                <span className="text-ink-soft">Doctor</span>
                <span className="font-semibold">{selectedDoctor?.name} ({selectedDoctor?.specialization})</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-ink-soft">When</span>
                <span className="font-semibold">{selectedDate} at {selectedSlot}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-ink-soft">Mode</span>
                <span className="font-semibold">{mode}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-ink-soft">Recovery Twin</span>
                <span className="font-semibold">{shareTwin ? "Shared ✅" : "Not Shared"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Fee</span>
                <span className="font-semibold">₹{selectedDoctor?.fee}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-2 border-t flex justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 rounded-full font-semibold border hover:bg-surface-soft">Back</button>
        ) : <div />}
        
        {step < 6 ? (
          <button 
            onClick={() => setStep(s => s + 1)} 
            disabled={(step === 1 && !selectedDoctor) || (step === 2 && !selectedDate) || (step === 3 && !selectedSlot) || (step === 4 && !reason)}
            className="px-6 py-2 rounded-full font-semibold bg-brand text-white disabled:opacity-50"
          >
            Next Step
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-6 py-2 rounded-full font-semibold bg-teal text-white disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Submitting..." : "Submit Request"}
            {!loading && <Icon name="check" className="size-4" />}
          </button>
        )}
      </div>
    </Card>
  );
}

function DoctorCard({ doc, onSelect }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-line hover:border-brand/30 transition-colors cursor-pointer bg-surface group" onClick={onSelect}>
      <div className="grid size-16 shrink-0 place-items-center rounded-full bg-brand-soft text-brand text-xl font-bold">
        {doc.name.split(" ").map(n => n[0]).join("").replace("D", "").substring(0, 2)}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-display font-semibold text-lg text-ink group-hover:text-brand transition-colors">{doc.name}</h4>
            <p className="text-sm text-ink-soft font-medium">{doc.specialization} · {doc.hospital}</p>
          </div>
          <Pill tone="mint" className="hidden sm:inline-flex">⭐ {doc.rating}</Pill>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-faint">
          <span className="bg-surface-soft px-2 py-1 rounded-md">{doc.experience_years} Yrs Exp</span>
          <span className="bg-surface-soft px-2 py-1 rounded-md">₹{doc.fee}</span>
          <span className="bg-surface-soft px-2 py-1 rounded-md">{doc.languages}</span>
        </div>
      </div>
    </div>
  );
}
