"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OAuthSuccessContent() {
  const params = useSearchParams();
  const plugin = params.get("plugin");
  const error = params.get("error");

  useEffect(() => {
    if (plugin) {
      // Trigger a storage event across the same domain
      try { localStorage.setItem("corsair-connected", JSON.stringify({ plugin, ts: Date.now() })); } catch (e) {}
    }
    
    // Attempt to close immediately and also after a tiny delay
    const closeWindow = () => { try { window.close(); } catch (e) {} };
    closeWindow();
    setTimeout(closeWindow, 100);
  }, [plugin, error]);

  return (
    <div className="min-h-screen bg-[#f4f4f8] flex items-center justify-center p-4">
      <p className="text-sm text-[#6b7280]">
        {error ? "Connection failed. You can close this window." : "Connected! You can close this window."}
      </p>
    </div>
  );
}

export default function OAuthSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f4f8] flex items-center justify-center"><p className="text-sm text-[#6b7280]">Loading...</p></div>}>
      <OAuthSuccessContent />
    </Suspense>
  );
}
