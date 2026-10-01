import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIMEOUT = 9 * 60 * 1000; // 9 minutes

export function AutoLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    // Clear storage and authentication cookies
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userName");
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    toast.error("Session expired due to inactivity.");
    navigate({ to: "/" });
  }, [navigate]);

  const resetTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Hide warning if it was shown
    setShowWarning(false);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_TIMEOUT);

    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

    // Throttled activity handler to prevent excessive renders/timer resets
    let throttleTimer = false;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = true;
      resetTimers();
      setTimeout(() => {
        throttleTimer = false;
      }, 500); // 500ms throttle
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial start
    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimers]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden relative">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <LogOut className="h-6 w-6" />
          </div>
          <div className="pt-1">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Session Expiring</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed font-semibold">
              You have been inactive for 9 minutes. You will be logged out in 1 minute unless you
              continue using the application.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Logout Now
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetTimers();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
