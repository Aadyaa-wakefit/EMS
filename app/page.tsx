// app/page.jsx
import HeroSection from "././components/HeroSection";
import PortalSection from "././components/PortalSection";

export default function HomePage() {
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side */}
      <HeroSection />

      {/* Right Side */}
      <PortalSection />
    </main>
  );
}