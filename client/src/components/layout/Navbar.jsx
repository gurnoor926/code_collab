
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import NotificationBell from "../notifications/NotificationBell";
import {
  Code2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  UserRound,
  Video,
  Users,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import UserAvatar from "../common/UserAvatar";
import toast from "react-hot-toast";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const closeMenus = () => {
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const navLinks = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label:"Problems",
      path:"/problems",
      icon: Code2,
    },
    {
      label: "Interviews",
      path: "/interviews",
      icon: Video,
    },
    ...(user?.role === "candidate" ? [
      {
        label: "Join Interview",
        path: "/interviews/join",
        icon: Users,
      }
    ]:[])
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#09090f]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <NavLink
          to="/dashboard"
          onClick={closeMenus}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
            <Code2 size={21} className="text-white" />
          </div>

          <span className="text-xl font-bold tracking-tight text-white">
            Code<span className="text-indigo-400">Collab</span>
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={17} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
         <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white/5"
            >
              <UserAvatar user={user} size="md" />

              <div className="hidden text-left sm:block">
                <p className="max-w-32 truncate text-sm font-semibold text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs capitalize text-zinc-500">
                  {user?.role || "Member"}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-zinc-500 transition sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#18181f] shadow-2xl shadow-black/40">

                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="lg" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {user?.name}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <span className="mt-3 inline-block rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-medium capitalize text-indigo-400">
                    {user?.role}
                  </span>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenus();
                      toast("Profile management is coming soon.");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <UserRound size={17} />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-300 hover:bg-white/5 md:hidden"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t border-white/[0.07] bg-[#101017] px-4 py-3 md:hidden">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMenus}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
