
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  ArrowRight,
  Loader2,
  Code2,
  BriefcaseBusiness,
  CheckCircle2,
  Camera,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import PasswordField from "../../components/auth/PasswordField";
import { useAuth } from "../../hooks/useAuth";

// Avatar preview component
function AvatarPreview({ file }) {
  const preview = useMemo(() => {
    if (!file) return "";

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.05]">
      {preview ? (
        <img
          src={preview}
          alt="Profile preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <User size={32} className="text-zinc-500" />
      )}
    </div>
  );
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "candidate",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2 MB.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (name.length < 3 || name.length > 50) {
      toast.error("Name must contain 3–50 characters.");
      return;
    }

    if (
      formData.password.length < 6 ||
      formData.password.length > 72
    ) {
      toast.error("Password must contain 6–72 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const registrationData = new FormData();

    registrationData.append("name", name);
    registrationData.append("email", email);
    registrationData.append("password", formData.password);
    registrationData.append("role", formData.role);

    if (avatarFile) {
      registrationData.append("avatar", avatarFile);
    }

    setLoading(true);

    try {
      await register(registrationData);

      toast.success("Account created successfully!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: "candidate",
      title: "Candidate",
      description:
        "Solve coding challenges and participate in interviews.",
      icon: Code2,
    },
    {
      id: "interviewer",
      title: "Interviewer",
      description:
        "Create interviews, assess candidates and give feedback.",
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join CodeCollab and start collaborating on coding challenges."
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Role Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-300">
            I want to join as
          </label>

          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const selected = formData.role === role.id;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      role: role.id,
                    }))
                  }
                  aria-pressed={selected}
                  className={`relative rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  {selected && (
                    <CheckCircle2
                      size={18}
                      className="absolute right-3 top-3 text-indigo-400"
                    />
                  )}

                  <Icon
                    size={23}
                    className={`mb-3 ${
                      selected
                        ? "text-indigo-400"
                        : "text-zinc-400"
                    }`}
                  />

                  <h3 className="text-sm font-semibold text-white">
                    {role.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="mb-3 block text-sm font-medium text-zinc-300">
            Profile picture
            <span className="ml-2 text-xs font-normal text-zinc-500">
              Optional
            </span>
          </label>

          <div className="flex items-center gap-4">
            <AvatarPreview file={avatarFile} />

            <div className="flex flex-col items-start gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />

              <label
                htmlFor="avatar-upload"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
              >
                <Camera size={16} />
                {avatarFile ? "Change picture" : "Upload picture"}
              </label>

              <p className="text-xs text-zinc-500">
                JPG, PNG or WebP · Max 2 MB
              </p>

              {avatarFile && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                  Remove picture
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Full name
          </label>

          <div className="relative">
            <User
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              autoComplete="name"
              minLength={3}
              maxLength={50}
              required
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Email address
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Password
          </label>

          <PasswordField
            id="password"
            value={formData.password}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                password: event.target.value,
              }))
            }
            placeholder="Create a password"
            autoComplete="new-password"
          />

          <p className="mt-2 text-xs text-zinc-600">
            Use 6–72 characters.
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Confirm password
          </label>

          <PasswordField
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                confirmPassword: event.target.value,
              }))
            }
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-xs leading-5 text-zinc-600">
        By creating an account, you agree to use CodeCollab responsibly.
      </p>
    </AuthLayout>
  );
}

export default Register;
