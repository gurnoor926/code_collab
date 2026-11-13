import { useState, useMemo } from "react";
import {
  Code,
  FileCode,
  Camera,
  PlayCircle,
  Search,
} from "lucide-react";

const formatElapsed = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getEventBadge = (type) => {
  switch (type) {
    case "interview_started":
      return {
        label: "Started",
        icon: PlayCircle,
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    case "code_change":
      return {
        label: "Code",
        icon: Code,
        bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      };
    case "language_change":
      return {
        label: "Language",
        icon: FileCode,
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    case "snapshot":
      return {
        label: "Snapshot",
        icon: Camera,
        bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      };
    default:
      return {
        label: type,
        icon: Code,
        bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      };
  }
};

function ReplayEventList({
  events = [],
  currentEventIndex = -1,
  onSelectEvent,
}) {
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType !== "all" && ev.eventType !== filterType) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const payloadStr = JSON.stringify(ev.payload || "").toLowerCase();
        const typeStr = ev.eventType.toLowerCase();
        return payloadStr.includes(query) || typeStr.includes(query);
      }
      return true;
    });
  }, [events, filterType, search]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Event Log</h3>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
              {events.length}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            Click to jump
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {["all", "code_change", "language_change", "snapshot"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                filterType === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-2 space-y-1">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No events match the criteria.
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const eventIndex = ev.originalIndex !== undefined ? ev.originalIndex : idx;
            const isCurrent = eventIndex === currentEventIndex;
            const badge = getEventBadge(ev.eventType);
            const Icon = badge.icon;

            let previewText = "";
            if (ev.eventType === "code_change") {
              const code = ev.payload?.code || "";
              previewText = `${code.split("\n").length} lines, ${code.length} chars`;
            } else if (ev.eventType === "language_change") {
              previewText = `Switched to ${ev.payload?.language}`;
            } else if (ev.eventType === "snapshot") {
              previewText = `Full snapshot (${ev.payload?.language || "editor"})`;
            } else if (ev.eventType === "interview_started") {
              previewText = "Interview session started";
            }

            return (
              <button
                key={ev._id || ev.sequence || idx}
                type="button"
                onClick={() => onSelectEvent(eventIndex)}
                className={`w-full text-left rounded-xl p-2.5 transition flex items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                    : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${badge.bg}`}
                  >
                    <Icon size={14} />
                  </div>

                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-200">
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        #{ev.sequence}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-zinc-400">
                      {previewText}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono text-[11px] text-zinc-400">
                  {formatElapsed(ev.elapsedMs)}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ReplayEventList;
