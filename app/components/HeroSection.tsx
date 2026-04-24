// components/HeroSection.jsx
export default function HeroSection() {
  return (
    <section className="bg-[#15145a] text-white flex items-center justify-center px-8 py-16">
      <div className="max-w-md">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Employee <br /> Management System
        </h1>

        <p className="mt-6 text-gray-300 text-lg leading-relaxed">
          Streamline your workforce operations, track attendance, manage payroll,
          and empower your team securely.
        </p>
      </div>
    </section>
  );
}