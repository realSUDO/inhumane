"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Play, Moon, Sun } from "lucide-react";
import { useTypewriter } from "../hooks/use-typewriter";

const THEMES = [
  { c: "#111111", dark: "#ffffff", label: "Neutral" },
  { c: "#4A6FA5", dark: "#7B93FF", label: "Azure" },
  { c: "#2D6A4F", dark: "#5DDCCC", label: "Emerald" },
  { c: "#8B5CF6", dark: "#FF7BAA", label: "Magenta" },
];

export default function LandingPage() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [isDark, setIsDark] = useState(false);

  // Sync initial dark mode from document
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Set CSS variables on mount and theme change
  useEffect(() => {
    const color = isDark ? activeTheme.dark : activeTheme.c;
    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty("--accent-fg", activeTheme.label === "Neutral" ? (isDark ? "#000" : "#fff") : "#fff");
    
    // Mix the accent color subtly into the background
    const bgMixDark = `color-mix(in srgb, ${color} 4%, #000000)`;
    const bgMixLight = `color-mix(in srgb, ${color} 5%, #f2f6fc)`;
    const bgSecMixDark = `color-mix(in srgb, ${color} 5%, #0a0a0a)`;
    const bgSecMixLight = `color-mix(in srgb, ${color} 5%, #ffffff)`;
    
    document.documentElement.style.setProperty("--bg", isDark ? bgMixDark : bgMixLight);
    document.documentElement.style.setProperty("--bg-secondary", isDark ? bgSecMixDark : bgSecMixLight);
    document.documentElement.style.setProperty("--fg-primary", isDark ? "#ffffff" : "#111111");
    document.documentElement.style.setProperty("--fg-secondary", isDark ? "#888888" : "#666666");
    document.documentElement.style.setProperty("--border-color", isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)");
  }, [activeTheme, isDark]);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div 
      className="min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-700" 
      style={{ 
        background: "var(--bg)", 
        color: "var(--fg-primary)", 
        "--selection-bg": "var(--accent, #111)", 
        "--selection-text": "var(--accent-fg, #fff)" 
      } as any}
    >
      <style dangerouslySetInnerHTML={{ __html: `::selection { background: var(--selection-bg); color: var(--selection-text); }` }} />
      <Navbar />
      <HeroSection />
      <PhilosophySection />
      <FeatureSection />
      <AtmosphereSection activeTheme={activeTheme} setActiveTheme={setActiveTheme} isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <QuoteSection />
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="absolute top-0 inset-x-0 z-50 px-6 sm:px-12 py-6 flex justify-between items-center bg-transparent">
      <div className="flex items-center gap-1">
        <span className="text-2xl font-semibold tracking-tight" style={{ color: "var(--fg-primary)" }}>Inhumane</span>
      </div>
      <nav className="hidden md:flex items-center space-x-8 text-sm font-medium" style={{ color: "var(--fg-secondary)" }}>
        <Link href="#philosophy" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-primary)" }}>Manifesto</Link>
        <Link href="#features" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-primary)" }}>Features</Link>
        <Link href="#atmosphere" className="hover:opacity-70 transition-opacity" style={{ color: "var(--fg-primary)" }}>Atmosphere</Link>
      </nav>
      <div>
        <Link
          href="/chat"
          className="px-6 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-all shadow-sm"
          style={{ background: "var(--accent, #111)", color: "var(--accent-fg, #fff)" }}
        >
          OPEN WORKSPACE
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  const { displayed, done } = useTypewriter("Work at\nInhumane\nSpeed.", 45, 400);

  return (
    <section className="relative pt-40 pb-20 min-h-[90vh] flex flex-col justify-center overflow-hidden w-full">
      
      {/* Background Graphic & Video Wrapper (Full Width) */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-end opacity-80 dark:opacity-40 mix-blend-multiply dark:mix-blend-luminosity">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-right"
          src="/hero-loop.mp4"
        />
        <div 
          className="absolute inset-0 transition-colors duration-700" 
          style={{ background: "linear-gradient(to right, var(--bg) 0%, color-mix(in srgb, var(--bg) 85%, transparent) 40%, transparent 100%)" }} 
        />
        <div 
          className="absolute inset-0 transition-colors duration-700" 
          style={{ background: "linear-gradient(to top, var(--bg) 0%, transparent 20%)" }} 
        />
      </div>

      <div className="absolute -top-10 lg:-top-20 right-0 text-[18vw] font-bold -z-10 select-none pointer-events-none tracking-tighter transition-colors duration-700" style={{ color: "var(--fg-primary)", opacity: 0.03 }}>
        INHUMANE
      </div>

      {/* Content Wrapper (Constrained) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl lg:text-[110px] font-normal tracking-tight leading-[1.05] mb-12 max-w-5xl whitespace-pre-wrap"
          style={{ color: "var(--fg-primary)" }}
        >
          {displayed}
          {!done && <span className="inline-block w-[4px] h-[0.9em] align-middle ml-2 animate-blink transition-colors duration-700" style={{ background: "var(--accent, #111)" }}></span>}
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="max-w-xl"
        >
          <p className="text-lg leading-relaxed mb-10 transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            A workspace for those who demand clarity over noise. We are the digital architecture for the aesthetic few.
          </p>
          <div className="flex flex-wrap gap-6 items-center">
            <Link 
              href="/chat"
              className="px-10 py-4 rounded-full font-medium hover:scale-105 transition-all shadow-xl"
              style={{ background: "var(--accent, #111)", color: "var(--accent-fg, #fff)" }}
            >
              Get Started
            </Link>
            <Link 
              href="#philosophy" 
              className="hover:opacity-70 transition-colors font-medium underline underline-offset-8"
              style={{ color: "var(--fg-secondary)", textDecorationColor: "var(--border-color)" }}
            >
              Read the Manifesto
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PhilosophySection() {
  return (
    <section id="philosophy" className="py-32 px-6 sm:px-12 transition-colors duration-700" style={{ background: "var(--bg-secondary)" }}>
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start border-t pt-16 transition-colors duration-700"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="md:col-span-4">
          <span className="text-xs font-semibold uppercase tracking-widest transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>Section 01 — Philosophy</span>
        </div>
        <div className="md:col-span-8 space-y-20">
          <div className="max-w-2xl">
            <p className="leading-relaxed text-lg sm:text-xl transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
              Generic AI is built for everyone. It is polite, verbose, and visually unremarkable. It hides behind conversational pleasantries and cluttered interfaces.
            </p>
          </div>
          <div className="max-w-2xl border-t pt-12 transition-colors duration-700" style={{ borderColor: "var(--border-color)" }}>
            <p className="leading-relaxed text-lg sm:text-xl transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
              Inhumane is the correction. We prioritize raw signal. We strip away the "chat" and return to the "canvas." It is the precision of a scalpel in a world of blunt instruments.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start border-t pt-16 mt-32 transition-colors duration-700"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="md:col-span-4">
          <span className="text-sm font-medium transition-colors duration-700" style={{ color: "var(--fg-primary)" }}>The Antithesis</span>
        </div>
        <div className="md:col-span-8">
          <p className="leading-relaxed text-lg sm:text-xl max-w-2xl transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            Your workspace should feel like a gallery, not a customer support ticket. High-fidelity responses, minimal friction, and a layout that respects your intelligence.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section id="features" className="py-32 px-6 sm:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer"
        >
          <img 
            alt="Conceptual architecture visualization" 
            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
            src="/pure_flow.png"
          />
          <div 
            className="absolute inset-0 mix-blend-overlay opacity-0 group-hover:opacity-40 transition-opacity duration-500" 
            style={{ background: "var(--accent, transparent)" }} 
          />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8 lg:pl-12"
        >
          <div>
            <h3 className="text-xl font-medium mb-6 transition-colors duration-700" style={{ color: "var(--fg-primary)" }}>Pure Flow</h3>
            <p className="leading-relaxed text-lg sm:text-xl max-w-md transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
              Experience a workspace that anticipates your rhythm. No bubbles. No clutter. Just a seamless stream of refined intelligence presented on a high-contrast canvas.
            </p>
          </div>
          <Link 
            href="/chat"
            className="inline-block border-b pb-1 font-medium hover:opacity-60 transition-colors duration-700"
            style={{ borderColor: "var(--fg-primary)", color: "var(--fg-primary)" }}
          >
            Explore Interface
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function AtmosphereSection({ activeTheme, setActiveTheme, isDark, toggleDarkMode }: { activeTheme: any, setActiveTheme: any, isDark: boolean, toggleDarkMode: () => void }) {
  return (
    <section id="atmosphere" className="py-32 px-6 sm:px-12 overflow-hidden transition-colors duration-700" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="order-2 lg:order-1"
        >
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2 transition-colors duration-700" style={{ color: "var(--fg-primary)" }}>
            Atmospheric Tint
            <span className="w-2 h-2 rounded-full animate-pulse transition-colors duration-700" style={{ background: "var(--accent, #111)" }} />
          </h3>
          <p className="leading-relaxed text-lg sm:text-xl max-w-md mb-10 transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            Our dynamic UI shifts subtly as your thoughts evolve. Not through jarring color changes, but through a 'dipped' atmospheric tint that anchors your focus. Includes global dark mode.
          </p>
          
          <div className="flex gap-4 items-center">
            {THEMES.map((t) => {
              const isActive = activeTheme.label === t.label;
              return (
                <button
                  key={t.label}
                  onClick={() => setActiveTheme(t)}
                  className={`w-10 h-10 rounded-full transition-all duration-300 border border-transparent ${isActive ? "scale-125 ring-2 ring-offset-4" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                  style={{ background: isDark ? t.dark : t.c, borderColor: isActive ? "var(--accent)" : "var(--border-color)", "--tw-ring-offset-color": "var(--bg-secondary)", "--tw-ring-color": "var(--fg-primary)" } as any}
                  aria-label={`Set accent to ${t.label}`}
                />
              );
            })}
            
            <div className="w-px h-8 mx-2 transition-colors duration-700" style={{ background: "var(--border-color)" }} />
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full flex items-center justify-center border hover:scale-110 transition-all shadow-sm"
              style={{ background: "var(--bg)", borderColor: "var(--border-color)", color: "var(--fg-primary)" }}
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </motion.div>

          <Link href="/chat" className="order-1 lg:order-2 relative group block">
            <div 
              className="rounded-3xl overflow-hidden flex flex-col p-6 lg:p-8 transition-colors duration-700 shadow-2xl"
              style={{ borderColor: "var(--border-color)", background: "var(--bg)", border: `1px solid var(--border-color)` }}
            >
              <div className="text-center mb-8 mt-4">
                <h4 className="text-2xl font-semibold tracking-tight transition-colors duration-700 mb-2" style={{ color: "var(--fg-primary)" }}>Good evening.</h4>
                <p className="text-sm transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>What are we working on?</p>
              </div>
              
              {/* Input Mock */}
              <div className="rounded-2xl p-4 transition-colors duration-700 flex items-center gap-3 shadow-inner" style={{ background: "var(--bg-secondary)", border: `1px solid var(--border-color)` }}>
                 <div className="flex-1 text-sm transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>Type a command or ask a question...</div>
                 <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-700" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                   <ArrowRight size={14} />
                 </div>
              </div>
              
              {/* Chips Mock */}
              <div className="flex gap-2 mt-4 justify-center">
                <div className="px-4 py-2 rounded-full text-xs font-medium transition-colors duration-700" style={{ border: `1px solid var(--border-color)`, color: "var(--fg-primary)" }}>Read Inbox</div>
                <div className="px-4 py-2 rounded-full text-xs font-medium transition-colors duration-700" style={{ border: `1px solid var(--border-color)`, color: "var(--fg-primary)" }}>Check Schedule</div>
              </div>

            </div>
          </Link>
      </div>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="py-48 px-6 sm:px-12 text-center transition-colors duration-700" style={{ background: "var(--bg)" }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light italic leading-tight tracking-tight mb-12 text-balance transition-colors duration-700" style={{ color: "var(--fg-primary)" }}>
          "Modern intelligence shouldn't look like a chat app. It should look like an ambition."
        </h2>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>— THE INHUMANE MANIFESTO</span>
      </motion.div>
    </section>
  );
}


function Footer() {
  return (
    <footer className="pt-32 pb-12 px-6 sm:px-12 border-t transition-colors duration-700" style={{ background: "var(--bg)", borderColor: "var(--border-color)" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 mb-32">
        <div className="md:col-span-5">
          <h4 className="text-2xl font-semibold tracking-tight mb-6 transition-colors duration-700" style={{ color: "var(--fg-primary)" }}>Inhumane</h4>
          <p className="max-w-xs leading-relaxed transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            Built for those who believe the future of AI is not more, but better.
          </p>
        </div>
        <div className="md:col-span-2 space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>Product</h5>
          <ul className="space-y-3 text-sm font-medium transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            <li><Link href="#philosophy" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Manifesto</Link></li>
            <li><Link href="/chat" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Workspace</Link></li>
            <li><Link href="/chat" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Beta</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2 space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>Legal</h5>
          <ul className="space-y-3 text-sm font-medium transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            <li><Link href="/privacy" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Privacy</Link></li>
            <li><Link href="/terms" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Terms</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2 space-y-4">
          <h5 className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>Social</h5>
          <ul className="space-y-3 text-sm font-medium transition-colors duration-700" style={{ color: "var(--fg-secondary)" }}>
            <li><Link href="#" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Twitter</Link></li>
            <li><Link href="#" className="hover:opacity-70 transition-colors" style={{ color: "var(--fg-primary)" }}>Instagram</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest pt-12 border-t transition-colors duration-700" style={{ borderColor: "var(--border-color)", color: "var(--fg-secondary)" }}>
        <p>© {new Date().getFullYear()} Inhumane AI. All rights reserved.</p>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-700" style={{ background: "var(--accent, #10b981)" }}></span>
          <span>Systems Operational</span>
        </div>
      </div>
    </footer>
  );
}
