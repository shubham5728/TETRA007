"use client";

import { Card, CardTitle, Pill } from "@/components/ui";

export default function DoctorAuditLogsView({ auditLogs }) {
  return (
    <Card>
      <CardTitle
        eyebrow="Section 8 — Access Control & Immutable Audit Trail"
        title="Clinical Audit & Activity Stream"
        hint="Immutable audit log tracking all patient record accesses, prescriptions, risk overrides, and emergency SOS resolutions"
      />

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line font-semibold uppercase text-ink-faint">
              <th className="pb-2 pr-3">Timestamp</th>
              <th className="pb-2 pr-3">Doctor ID</th>
              <th className="pb-2 pr-3">Action</th>
              <th className="pb-2">Details & Audit Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-surface-soft">
                <td className="py-3 pr-3 text-ink-faint">{log.timestamp}</td>
                <td className="py-3 pr-3 font-semibold text-ink">{log.doctor}</td>
                <td className="py-3 pr-3">
                  <Pill tone="brand">{log.action}</Pill>
                </td>
                <td className="py-3 text-ink-soft">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
