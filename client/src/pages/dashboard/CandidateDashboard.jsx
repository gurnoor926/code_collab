import {
  Code2,
  Trophy,
  Clock3,
  Video,
  ArrowRight,
  BookOpen,
  Target,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import UserAvatar from "../../components/common/UserAvatar";
import AppLayout from "../../components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import submissionService from "../../services/submissionService";
import interviewService from "../../services/interviewService";

function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    problemsSolved: 0,
    totalSubmissions: 0,
    interviews: 0,
    practiceTime: null,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboardStats = async () => {
      try {
        setStatsLoading(true);

        // First submission page gives us the total page count.
        const firstPage = await submissionService.getMySubmissions({
          page: 1,
          limit: 50,
        });

        const submissionData = firstPage?.data;
        const pagination = submissionData?.pagination;

        const allSubmissions = [...(submissionData?.submissions || [])];

        // Fetch remaining pages if the user has more than 50 submissions.
        if (pagination?.totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: pagination.totalPages - 1 }, (_, index) =>
              submissionService.getMySubmissions({
                page: index + 2,
                limit: 50,
              }),
            ),
          );

          remainingPages.forEach((page) => {
            allSubmissions.push(...(page?.data?.submissions || []));
          });
        }

        // Count unique problems with at least one accepted submission.
        const solvedProblemIds = new Set(
          allSubmissions
            .filter(
              (submission) =>
                submission.status === "Accepted" && submission.problem?._id,
            )
            .map((submission) => submission.problem._id),
        );

        // Interview endpoint returns pagination at the top level.
        const interviewResponse = await interviewService.getMyInterviews({
          page: 1,
          limit: 50,
        });

        if (!active) return;

        setStats({
          problemsSolved: solvedProblemIds.size,
          totalSubmissions: pagination?.total ?? 0,
          interviews: interviewResponse?.pagination?.total ?? 0,
          practiceTime: null,
        });
      } catch (error) {
        console.error("Dashboard statistics error:", error);
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    };

    loadDashboardStats();

    return () => {
      active = false;
    };
  }, []);

  const quickActions = [
    {
      title: "Practice Problems",
      description: "Improve your problem-solving skills.",
      icon: Code2,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      title: "My Submissions",
      description: "Review your coding attempts.",
      icon: BookOpen,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      title: "My Interviews",
      description: "View your interview sessions.",
      icon: Video,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-[#18181f] to-[#18181f] p-6 sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-400">
                CANDIDATE WORKSPACE
              </p>

              <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                Welcome back, {user?.name?.split(" ")[0] || "Developer"}!
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Practice coding, track your progress and prepare for your next
                technical interview.
              </p>
            </div>

            <UserAvatar user={user} size="xl" />
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Problems Solved",
                icon: Code2,
                value: stats.problemsSolved,
              },
              {
                label: "Total Submissions",
                icon: Target,
                value: stats.totalSubmissions,
              },
              {
                label: "Interviews",
                icon: Video,
                value: stats.interviews,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-[#18181f] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-400">{item.label}</p>
                    <Icon size={19} className="text-indigo-400" />
                  </div>

                  <p className="mt-4 text-xl font-semibold text-white">
                    {statsLoading ? (
                      <span className="animate-pulse text-sm text-zinc-500">
                        Loading...
                      </span>
                    ) : (
                      item.value
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Quick Access</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Jump into your coding workspace.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => {
                    if (action.title === "Practice Problems") {
                      navigate("/problems");
                    } else if (action.title === "My Submissions") {
                      navigate("/submissions");
                    } else if (action.title === "My Interviews") {
                      navigate("/interviews");
                    }
                  }}
                  className="group rounded-xl border border-white/10 bg-[#18181f] p-5 text-left transition hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-[#1d1d27]"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.bg} ${action.color}`}
                    >
                      <Icon size={21} />
                    </div>

                    <ArrowRight
                      size={18}
                      className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-indigo-400"
                    />
                  </div>

                  <h3 className="mt-5 font-semibold text-white">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-xl border border-white/10 bg-[#18181f] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Trophy size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <p className="text-sm text-zinc-500">
                Your latest coding and interview activity.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-white/10 px-4 py-10 text-center">
            <Clock3 size={25} className="mx-auto text-zinc-600" />

            <p className="mt-3 text-sm font-medium text-zinc-300">
              No activity to display yet
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Your submissions and interview activity will appear here.
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default CandidateDashboard;
