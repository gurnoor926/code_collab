import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Code2,
  Video,
  FileCheck2,
  BarChart3,
  Award,
  ShieldCheck,
  ArrowUpRight,
  LoaderCircle,
  Film,
} from "lucide-react";
import toast from "react-hot-toast";

import adminService from "../../services/adminService";
import ProblemManagement from "../../components/admin/ProblemManagement";
import InterviewAdministration from "../../components/admin/InterviewAdministration";
import UserManagement from "../../components/admin/UserManagement";
import Navbar from "../../components/layout/Navbar";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "problems" | "interviews" | "users"

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getStats();
      if (res?.success) {
        setStats(res.data);
      }
    } catch {
      toast.error("Failed to load admin stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <Navbar />

      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Admin Control Center
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Platform analytics, problem library management, interview monitoring & governance.
                </p>
              </div>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-[#12121a] p-1.5">
            {[
              { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
              { id: "problems", label: "Problem Bank", icon: Code2 },
              { id: "interviews", label: "Interviews", icon: Video },
              { id: "users", label: "Users", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Overview & Analytics */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <LoaderCircle className="animate-spin text-indigo-500" size={36} />
                <p className="text-xs text-zinc-400 font-medium">Gathering platform statistics...</p>
              </div>
            ) : !stats ? (
              <div className="py-16 text-center text-sm text-zinc-500">
                Failed to load platform stats.
              </div>
            ) : (
              <>
                {/* Key Metric Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Users */}
                  <div className="rounded-2xl border border-white/10 bg-[#13131c] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Total Users</span>
                      <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400">
                        <Users size={18} />
                      </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-white">
                      {stats.users.total}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                      <span className="text-emerald-400 font-medium">{stats.users.candidates} candidates</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-medium">{stats.users.interviewers} interviewers</span>
                    </div>
                  </div>

                  {/* Problems */}
                  <div className="rounded-2xl border border-white/10 bg-[#13131c] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Coding Problems</span>
                      <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
                        <Code2 size={18} />
                      </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-white">
                      {stats.problems.total}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-emerald-400">{stats.problems.published} Published</span>
                      <span>•</span>
                      <span className="text-amber-400">{stats.problems.unpublished} Drafts</span>
                    </div>
                  </div>

                  {/* Interviews */}
                  <div className="rounded-2xl border border-white/10 bg-[#13131c] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Interview Sessions</span>
                      <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                        <Video size={18} />
                      </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-white">
                      {stats.interviews.total}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-emerald-400 font-medium">{stats.interviews.completed} finished</span>
                      <span>•</span>
                      <span className="text-amber-400 font-medium">{stats.interviews.active} live</span>
                    </div>
                  </div>

                  {/* Submissions & Pass rate */}
                  <div className="rounded-2xl border border-white/10 bg-[#13131c] p-5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Total Submissions</span>
                      <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                        <FileCheck2 size={18} />
                      </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-white">
                      {stats.submissions.total}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-emerald-400 font-medium">{stats.submissions.passRate}% acceptance</span>
                      <span>•</span>
                      <span>{stats.submissions.accepted} passed</span>
                    </div>
                  </div>
                </div>

                {/* Second Row: Problem Breakdown, Interview Breakdown, Evaluation Overview */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Problem Distribution */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 space-y-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Code2 size={16} className="text-indigo-400" />
                      Problem Difficulty Distribution
                    </h3>
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-emerald-400 font-medium">Easy</span>
                          <span className="font-mono text-zinc-300">{stats.problems.easy}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${stats.problems.total ? (stats.problems.easy / stats.problems.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-amber-400 font-medium">Medium</span>
                          <span className="font-mono text-zinc-300">{stats.problems.medium}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${stats.problems.total ? (stats.problems.medium / stats.problems.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-red-400 font-medium">Hard</span>
                          <span className="font-mono text-zinc-300">{stats.problems.hard}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{
                              width: `${stats.problems.total ? (stats.problems.hard / stats.problems.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interview Status Breakdown */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 space-y-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Video size={16} className="text-blue-400" />
                      Interview Status Breakdown
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3">
                        <span className="text-[11px] text-zinc-500">Scheduled</span>
                        <p className="text-lg font-bold text-blue-400 mt-1">
                          {stats.interviews.scheduled}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3">
                        <span className="text-[11px] text-zinc-500">Waiting (Candidate Joined)</span>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                          {stats.interviews.waiting}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3">
                        <span className="text-[11px] text-zinc-500">Active (In Progress)</span>
                        <p className="text-lg font-bold text-emerald-400 mt-1">
                          {stats.interviews.active}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3">
                        <span className="text-[11px] text-zinc-500">Completed</span>
                        <p className="text-lg font-bold text-zinc-300 mt-1">
                          {stats.interviews.completed}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Overview */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 space-y-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Award size={16} className="text-purple-400" />
                      Evaluation & Hiring Overview
                    </h3>
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[11px] text-zinc-500">Avg Overall Score</span>
                        <p className="text-xl font-bold text-purple-400">
                          {stats.evaluations.averageOverallScore} / 100
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-zinc-500">Evaluations</span>
                        <p className="text-xl font-bold text-zinc-200">
                          {stats.evaluations.total}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-emerald-400">
                        <span>Strong Hire</span>
                        <span className="font-bold">{stats.evaluations.recommendations.strong_hire || 0}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-indigo-400">
                        <span>Hire</span>
                        <span className="font-bold">{stats.evaluations.recommendations.hire || 0}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-amber-400">
                        <span>Hold</span>
                        <span className="font-bold">{stats.evaluations.recommendations.hold || 0}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-2.5 py-1.5 text-red-400">
                        <span>No Hire</span>
                        <span className="font-bold">{stats.evaluations.recommendations.no_hire || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Third Row: Recent Activity Lists */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Recent Interviews */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Recent Interviews</h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("interviews")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        View all <ArrowUpRight size={13} />
                      </button>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                      {(stats.recentActivity?.interviews || []).map((intw) => (
                        <div
                          key={intw._id}
                          className="py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <Link
                              to={`/interviews/${intw._id}`}
                              className="font-semibold text-zinc-200 hover:text-indigo-400 transition truncate block"
                            >
                              {intw.title}
                            </Link>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {intw.interviewer?.name || "Interviewer"} with {intw.candidate?.name || "Candidate"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-400">
                              {intw.status}
                            </span>
                            {intw.status === "completed" && (
                              <Link
                                to={`/interviews/${intw._id}/replay`}
                                className="rounded p-1 text-indigo-400 hover:bg-indigo-500/10"
                                title="Session Replay"
                              >
                                <Film size={14} />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Submissions */}
                  <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Latest Submissions</h3>
                      <span className="text-xs text-zinc-500">Live platform feed</span>
                    </div>

                    <div className="divide-y divide-white/[0.04]">
                      {(stats.recentActivity?.submissions || []).map((sub) => (
                        <div
                          key={sub._id}
                          className="py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-zinc-200 truncate block">
                              {sub.problem?.title || "Problem"}
                            </span>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              by {sub.user?.name || "Candidate"} • {new Date(sub.submittedAt || sub.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                sub.status === "Accepted"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {sub.status}
                            </span>
                            <span className="font-mono text-[10px] uppercase text-zinc-500">
                              {sub.language}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Problems Management */}
        {activeTab === "problems" && <ProblemManagement />}

        {/* Tab 3: Interviews Administration */}
        {activeTab === "interviews" && <InterviewAdministration />}

        {/* Tab 4: Users Governance */}
        {activeTab === "users" && <UserManagement />}
      </main>
    </div>
  );
}

export default AdminDashboard;
