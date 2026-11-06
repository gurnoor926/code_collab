
import { useState } from "react";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "U";

  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// Separate component so a failed image resets when its URL changes.
function AvatarImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full rounded-full object-cover"
    />
  );
}

function UserAvatar({
  user,
  size = "md",
  showStatus = false,
  online = false,
  className = "",
}) {
  const avatarUrl = user?.avatar;
  const initials = getInitials(user?.name);

  const avatarSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/30 to-violet-500/30 font-semibold text-indigo-200 ${avatarSize} ${className}`}
      title={user?.name || "User"}
    >
      {avatarUrl ? (
        <AvatarImage
          key={avatarUrl}
          src={avatarUrl}
          alt={`${user?.name || "User"}'s profile`}
        />
      ) : (
        <span>{initials}</span>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#09090f] ${
            online ? "bg-emerald-400" : "bg-zinc-500"
          }`}
          title={online ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

export default UserAvatar;
