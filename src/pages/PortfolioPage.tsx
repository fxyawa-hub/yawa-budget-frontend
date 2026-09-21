import React from "react";
import { PortfolioNav } from "../components/portfolio/PortfolioNav";
import { HeroSection } from "../components/portfolio/HeroSection";
import { WorkSection } from "../components/portfolio/WorkSection";
import { AboutSection } from "../components/portfolio/AboutSection";
import { ContactSection } from "../components/portfolio/ContactSection";
import { NoiseOverlay } from "../components/portfolio/NoiseOverlay";

export const PortfolioPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] relative selection:bg-[#C9F24D] selection:text-[#0A0A0B]">
      {/* Subtle grain/noise texture overlay */}
      <NoiseOverlay />

      {/* Sticky Minimal Navigation Header */}
      <PortfolioNav />

      {/* Single Scrolling Page Main Content */}
      <main className="max-w-5xl mx-auto px-6">
        <HeroSection />
        <WorkSection />
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  );
};
