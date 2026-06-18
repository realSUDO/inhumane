"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Play, Moon, Sun } from "lucide-react";
import { useTypewriter } from "../hooks/use-typewriter";

const THEMES = [
  { c: "#111", dark: "#fff", label: "Neutral" },
  { c: "#10b981", dark: "#10b981", label: "Emerald" },
  { c: "#8b5cf6", dark: "#8b5cf6", label: "Violet" },
  { c: "#f59e0b", dark: "#f59e0b", label: "Amber" },
];

export default function LandingPage() {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]!);
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
    document.documentElement.style.setProperty("--bg", isDark ? "#000000" : "#f2f6fc");
    document.documentElement.style.setProperty("--bg-secondary", isDark ? "#0a0a0a" : "#ffffff");
    document.documentElement.style.setProperty("--fg-primary", isDark ? "#ffffff" : "#111111");
    document.documentElement.style.setProperty("--fg-secondary", isDark ? "#888888" : "#666666");
    document.documentElement.style.setProperty("--border-color", isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  const { displayed, done } = useTypewriter("Work at\nInhumane\nSpeed.", 45, 400);

  // Optimized Scrubber
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;

      const percentage = Math.max(0, Math.min(e.clientX / window.innerWidth, 1));
      targetTimeRef.current = percentage * (video.duration || 1);

      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        requestAnimationFrame(() => {
          if (video.duration && Math.abs(video.currentTime - targetTimeRef.current) > 0.08) {
            video.currentTime = targetTimeRef.current;
          }
          isUpdatingRef.current = false;
        });
      }
    };

    const handleResize = () => {
      if (window.innerWidth < 1024 && video.paused) {
        video.autoplay = true;
        video.play().catch(() => {});
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className="relative pt-40 pb-20 min-h-[90vh] flex flex-col justify-center overflow-hidden w-full">
      
      {/* Background Graphic & Video Wrapper (Full Width) */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-end opacity-80 dark:opacity-40 mix-blend-multiply dark:mix-blend-luminosity">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-right"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4"
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
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQQD34bPZx6pDS6oERCWIOLeV5P_B6Y5S2TjYY-0QroxT3oRY6hwc5NOACpl4W3EVSAgZJoi_31V_G94BCZA0NMgx_FGIxp0y2AenMenQTPa1bVsrbBRrlNNhdJndg1Rmez1-PTz2qqXBKnRS-qTrNz-4-_iVhWNtgAmNkNR_xMswp_lg-qIci2RDxzQ1b-rfBm6aOjcJ7f9rRJpfC5FtQ-TzUzWUiYG9Xb2FSemkBLnzAdwsLsyabalWS9MT5uOMoEtzPq3VfYIfc"
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

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="order-1 lg:order-2 relative group cursor-pointer"
        >
          <div 
            className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center border transition-colors duration-700"
            style={{ borderColor: "var(--border-color)", background: "var(--bg)" }}
          >
            <img 
              alt="Dynamic fluid visualization" 
              className={`w-full h-full object-cover transition-opacity duration-700 mix-blend-multiply dark:mix-blend-screen ${activeTheme.label === "Neutral" ? "opacity-60" : "opacity-40"}`} 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4ntGq6A__72tDNPlp2MloFi_EOaJvsb_AkqPTZkytdR2n1eULG6edH9XIZMnbx7jOv8up2d9CgOV01sh9gEdGL3dh2xerKNFmCR9wWVCehQ4ECgK8Qka0cThdXLq14q64aCr9oQpwTcBU0g75ld_oFdBbVkhnq0_SSjh5998z2QYf3nLOzbXORG_HJE_nOrGNnPdeT6mFEeqXf1YrBxtH-sGv-_h_2wRmKhDP4bV_2wLwTLg9R29gRfpchhgQLGYOu5PkMgqKqFko"
            />
            {/* Color Overlay */}
            <div 
              className="absolute inset-0 mix-blend-overlay opacity-40 transition-colors duration-700"
              style={{ background: activeTheme.label === "Neutral" ? "transparent" : "var(--accent)" }}
            />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform bg-black/10 dark:bg-white/10" style={{ borderColor: "var(--border-color)" }}>
                <Play className="w-6 h-6 ml-1 transition-colors duration-700" style={{ color: "var(--fg-primary)" }} />
              </div>
            </div>
          </div>
        </motion.div>
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
