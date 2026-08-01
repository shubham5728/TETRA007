"use client";

import AuraHealthCompanion from "@/components/AuraHealthCompanion";

/**
 * AURA Health Companion page wrapper.
 * Replaces the old AI Care Coordinator with the voice-first, multilingual
 * redesign.
 */
export default function CareCoordinatorView() {
  return (
    <div style={{ height: "calc(100vh - 80px)", minHeight: 600 }}>
      <AuraHealthCompanion />
    </div>
  );
}
