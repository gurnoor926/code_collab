import { useCallback, useEffect, useState } from "react";
import { Search, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";
import UserAvatar from "../common/UserAvatar";

const roleStyles = {
  admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  interviewer: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  candidate: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== "all") params.role = roleFilter;

      const res = await adminService.getUsers(params);
      if (res?.success) {
        setUsers(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-3 text-zinc-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-[#161622] px-3 py-2 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="interviewer">Interviewers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <span className="text-xs text-zinc-400">
          Total Users: <strong className="text-white">{pagination.total}</strong>
        </span>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-zinc-900/60 font-semibold text-zinc-400">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <LoaderCircle
                      className="mx-auto animate-spin text-indigo-500"
                      size={28}
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-16 text-center text-xs text-zinc-500"
                  >
                    No users found matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleClass =
                    roleStyles[u.role] ||
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

                  return (
                    <tr
                      key={u._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size="sm" />
                          <span className="font-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-zinc-400">
                        {u.email}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${roleClass}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-xs text-zinc-400">
            <span>
              Page {page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40 hover:bg-white/5"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
