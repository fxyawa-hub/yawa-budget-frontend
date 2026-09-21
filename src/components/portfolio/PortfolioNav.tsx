import React, { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const PortfolioNav: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  // Track active section on scroll
  useEffect(() => {
    const sections = ["work", "about", "contact"];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 300) {
        setActiveSection("hero");
        return;
      }
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - 120;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-base)]/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand / Name on Left */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-mono text-xs font-semibold tracking-tight text-[var(--text-primary)] hover:text-[#C9F24D] transition-colors"
          >
            FX Yawa
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider">
            <a
              href="#work"
              onClick={(e) => handleNavClick(e, "work")}
              className={`transition-colors ${
                activeSection === "work"
                  ? "text-[#C9F24D]"
                  : "text-[var(--text-secondary)] hover:text-[#C9F24D]"
              }`}
            >
              01 / Work
            </a>
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, "about")}
              className={`transition-colors ${
                activeSection === "about"
                  ? "text-[#C9F24D]"
                  : "text-[var(--text-secondary)] hover:text-[#C9F24D]"
              }`}
            >
              02 / About
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className={`transition-colors ${
                activeSection === "contact"
                  ? "text-[#C9F24D]"
                  : "text-[var(--text-secondary)] hover:text-[#C9F24D]"
              }`}
            >
              03 / Contact
            </a>
          </nav>

          {/* Actions: Theme Toggle & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Sun / Moon Theme Toggle: Icon only, no label */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors focus:outline-none"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 stroke-[1.75]" />
              ) : (
                <Moon className="w-3.5 h-3.5 stroke-[1.75]" />
              )}
            </button>

            {/* Mobile Hamburger Toggle (hidden on desktop) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 rounded-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
            >
              <Menu className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Overlay Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[var(--bg-base)] p-6 transition-colors"
        >
          {/* Header row in mobile menu */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <span className="font-mono text-xs font-semibold tracking-tight text-[var(--text-primary)]">
              FX Yawa
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="p-2 rounded-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-8 my-auto font-mono text-xl tracking-wide">
            <a
              href="#work"
              onClick={(e) => handleNavClick(e, "work")}
              className={`transition-colors ${
                activeSection === "work"
                  ? "text-[#C9F24D]"
                  : "text-[var(--text-primary)] hover:text-[#C9F24D]"
              }`}
            >
              01 / Work
            </a>
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, "about")}
              className={`transition-colors ${
                activeSection === "about"
                  ? "text-[#C9F24D]"
                  : "text-[var(--text-primary)] hover:text-[#C9F24D]"
              }`}
            >
              02 / About
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className={`transition-colors ${
                activeSection === "contact"
                  ? "text-[#C9F24D]"
                  : "text-[var(--text-primary)] hover:text-[#C9F24D]"
              }`}
            >
              03 / Contact
            </a>
          </div>

          {/* Footer inside mobile menu */}
          <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-between font-mono text-xs text-[var(--text-muted)]">
            <span>Java • Spring Boot • React</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xs border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#C9F24D]"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
