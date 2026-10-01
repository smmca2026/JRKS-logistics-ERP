import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { checkAuthServerFn } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import pageBg from "@/assets/login-page-bg.png";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || document.cookie.includes("isLoggedIn=true");
      if (isLoggedIn) {
        throw redirect({ to: "/consignment-note" });
      }
      return;
    }
    const isServerLoggedIn = await checkAuthServerFn();
    if (isServerLoggedIn) {
      throw redirect({ to: "/consignment-note" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — JRKS Logistics ERP" },
      {
        name: "description",
        content:
          "Sign in to the JRKS Logistics ERP workspace to manage your transport master data.",
      },
      { property: "og:title", content: "Sign in — JRKS Logistics ERP" },
      {
        property: "og:description",
        content: "Secure access to the JRKS Logistics enterprise workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = "/api";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter your username and password.");
      return;
    }
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const rawUser = data.user.username || "Admin";
        const isBranch = rawUser.toLowerCase() === "trichybranch" || rawUser.toLowerCase() === "trichy branch" || data.user.role === "branch";
        const role = isBranch ? "branch" : "admin";
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("userRole", role);
        sessionStorage.setItem("userName", rawUser);
        document.cookie = "isLoggedIn=true; path=/; SameSite=Lax";
        toast.success("Welcome back to JRKS Logistics.");
        navigate({ to: "/consignment-note" });
      } else {
        toast.error(data.error || "Invalid username or password.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2 bg-[#040d21] overflow-x-hidden">
      {/* Full screen background image for desktop */}
      <div
        className="absolute inset-0 z-0 hidden lg:block bg-no-repeat"
        style={{
          backgroundImage: `url(${pageBg})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center center",
        }}
      />

      {/* Left spacing column to align the login card on the right */}
      <div className="hidden lg:block pointer-events-none z-10" />

      {/* Login Column */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md">
          {/* Logo visible only on mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Truck className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-white">JRKS Logistics</p>
          </div>
          {/* Form Card */}
          <div className="rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back!</h1>
              <p className="mt-1.5 text-sm font-medium text-white/80">
                Sign in to continue to your workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-bold text-white tracking-wide uppercase"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/70" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="h-12 pl-11 rounded-xl border-white/10 bg-white/[0.06] focus-visible:ring-blue-500 focus-visible:border-blue-500 font-medium text-white placeholder:text-white/40 focus:bg-white/[0.12] transition-all outline-none"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold text-white tracking-wide uppercase"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/70" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 pl-11 pr-11 rounded-xl border-white/10 bg-white/[0.06] focus-visible:ring-blue-500 focus-visible:border-blue-500 font-medium text-white placeholder:text-white/40 focus:bg-white/[0.12] transition-all outline-none"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(37,99,235,0.25)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
                {!loading && <ArrowRight className="h-4.5 w-4.5" />}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs font-semibold text-white/60">
              © 2026{" "}
              <a
                href="#"
                className="text-white/90 hover:text-white hover:underline transition-colors font-bold"
              >
                JRKS Logistics
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
