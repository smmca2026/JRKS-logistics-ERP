import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { checkAuthServerFn } from "@/lib/auth";
import {
  LayoutDashboard,
  Truck,
  Building2,
  Landmark,
  Handshake,
  LogOut,
  Menu,
  X,
  Search,
  ChevronsRight,
  FilePlus2,
  FileText,
  ClipboardList,
  Navigation,
  Receipt,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileCheck,
  Banknote,
  BookPlus,
  KeyRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoLogout } from "@/components/auto-logout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || document.cookie.includes("isLoggedIn=true");
      if (!isLoggedIn) {
        throw redirect({ to: "/" });
      }
      return;
    }
    const isServerLoggedIn = await checkAuthServerFn();
    if (!isServerLoggedIn) {
      throw redirect({ to: "/" });
    }
  },
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: LucideIcon };

const navOperations: NavItem[] = [
  { to: "/consignment-note", label: "Consignment Note", icon: FileText },
  { to: "/challan-note", label: "Challan Note", icon: FileCheck },
  { to: "/arrival-report", label: "Arrival Report", icon: MapPin },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/voucher-entry", label: "Voucher Entry", icon: Banknote },
  { to: "/money-receipt", label: "Money Receipt Entry", icon: Receipt },
];

const navRecords: NavItem[] = [
  { to: "/consignment-records", label: "Consignment Records", icon: ClipboardList },
  { to: "/challan-records", label: "Challan Records", icon: ClipboardList },
  { to: "/arrival-records", label: "Arrival Records", icon: ClipboardList },
  { to: "/bill-records", label: "Bill Records", icon: ClipboardList },
  { to: "/voucher-records", label: "Voucher Records", icon: ClipboardList },
  { to: "/money-receipt-records", label: "Money Receipt Records", icon: ClipboardList },
];

const navAccounts: NavItem[] = [
  { to: "/outstanding/company", label: "Company Outstanding", icon: Building2 },
  { to: "/outstanding/vendor", label: "Vendor Outstanding", icon: Handshake },
];

const navMasters: NavItem[] = [
  { to: "/trucks", label: "Market Truck Master", icon: Truck },
  { to: "/companies", label: "Company Master", icon: Building2 },
  { to: "/brokers", label: "Lorry Vendor Master", icon: Handshake },
  { to: "/banks", label: "Bank Master", icon: Landmark },
  { to: "/voucher-code-master", label: "Voucher Code Master", icon: Receipt },
];

const navTracking: NavItem[] = [{ to: "/lorry-tracking", label: "Track Lorry", icon: Navigation }];

function SidebarContent({
  onNavigate,
  collapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to;

  const renderGroup = (label: string, items: NavItem[]) => (
    <>
      <p
        className={cn(
          "mt-7 mb-2 px-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8FA3C8] transition-all",
          collapsed && "opacity-0 h-0 overflow-hidden mb-0 mt-0",
        )}
      >
        {label}
      </p>
      <div className={cn("space-y-1", collapsed && "mt-2")}>
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group flex items-center rounded-[14px] py-2.5 text-[15px] font-medium transition-all duration-200 border border-transparent",
              collapsed ? "justify-center px-0" : "gap-3 px-3.5",
              isActive(item.to)
                ? "bg-gradient-to-r from-[#0B2E6B] to-[#0F4CFF] text-white shadow-[0_4px_12px_rgba(15,76,255,0.3)] border-white/10"
                : "text-[#cbd5e1] hover:bg-[#123D8B] hover:text-white hover:border-white/5",
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 text-white",
                isActive(item.to) ? "opacity-100" : "opacity-75 group-hover:opacity-100",
              )}
            />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex h-full flex-col bg-[#071A3D] text-white overflow-hidden">
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-5 custom-sidebar-scroll transition-all",
          collapsed ? "px-2" : "px-4",
        )}
      >
        <div className="space-y-1">{/* Dashboard link removed as per request */}</div>
        {renderGroup("Lorry Tracking", navTracking)}

        {renderGroup("Operations", navOperations)}
        {renderGroup("Records", navRecords)}
        {renderGroup("Accounts", navAccounts)}
        {renderGroup("Masters", navMasters)}
      </nav>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [userRole, setUserRole] = useState("user");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState("admin");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const API_BASE = "/api";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const isChangingOwnPassword = targetUsername === (sessionStorage.getItem("userName") === "Trichy Branch" ? "Trichybranch" : "admin");
    if ((isChangingOwnPassword && !oldPassword) || !newPassword || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_BASE}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: targetUsername, 
          oldPassword: targetUsername !== (sessionStorage.getItem("userName") === "Trichy Branch" ? "Trichybranch" : "admin") ? "ADMIN_OVERRIDE" : oldPassword, 
          newPassword 
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Password updated successfully!");
        setChangePasswordOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || document.cookie.includes("isLoggedIn=true");
    const rawUser = sessionStorage.getItem("userName") || "Admin";
    const isBranch = rawUser.toLowerCase() === "trichybranch" || rawUser.toLowerCase() === "trichy branch" || sessionStorage.getItem("userRole") === "branch";
    const role = isBranch ? "branch" : "admin";
    if (!isLoggedIn) {
      navigate({ to: "/" });
    } else {
      if (sessionStorage.getItem("isLoggedIn") !== "true") {
        sessionStorage.setItem("isLoggedIn", "true");
      }
      sessionStorage.setItem("userRole", role);
      setUserName(rawUser);
      setUserRole(role);
    }
  }, [navigate]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userName");
      document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AutoLogout />
      {/* Fixed sidebar (desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden bg-sidebar lg:block transition-all duration-300",
          isCollapsed ? "w-[80px]" : "w-[280px]",
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-[#071a3d] hover:bg-slate-100 shadow-md transition-colors"
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
          />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar">
            <button
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]",
        )}
      >
        {/* Sticky top nav */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search across masters…" className="h-10 bg-background pl-9" />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-left leading-tight sm:block">
                    <p className="text-sm font-semibold text-foreground">{userName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      JRKS DIgital India Logistics LLP
                    </p>
                  </div>
                  <ChevronsRight className="hidden h-4 w-4 rotate-90 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    const currentU = sessionStorage.getItem("userName") === "Trichy Branch" ? "Trichybranch" : "admin";
                    setTargetUsername(currentU);
                    setChangePasswordOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and set your new password below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-4">
            {userRole === "admin" ? (
              <div className="space-y-2">
                <Label htmlFor="targetUsername">Select Account</Label>
                <select 
                  id="targetUsername" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="Trichybranch">Trichy Branch</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Account</Label>
                <p className="text-sm font-semibold text-slate-700">{userName}</p>
              </div>
            )}
            {targetUsername === (userName === "Trichy Branch" ? "Trichybranch" : "admin") && (
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
