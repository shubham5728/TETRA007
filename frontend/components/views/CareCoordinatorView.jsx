"use client";

import AuraHealthCompanion from "@/components/AuraHealthCompanion";

/**
 * AURA Health Companion page wrapper.
 * Replaces the old AI Care Coordinator with the voice-first, multilingual
 * redesign.
 */
export default function CareCoordinatorView() {
  return (
    <div className="h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-8rem)] min-h-[480px] sm:min-h-[600px] w-full">
      <AuraHealthCompanion />
    </div>
  );
}
