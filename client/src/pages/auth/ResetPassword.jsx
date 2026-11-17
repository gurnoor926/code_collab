import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import AuthLayout from "../../components/auth/AuthLayout";
import PasswordField from "../../components/auth/PasswordField";
import authService from "../../services/authService";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password) {
      toast.error("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, password);
      setSuccess(true);
      toast.success(response.message || "Password reset successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Password reset link is invalid or has expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Your new password must be at least 6 characters long."
    >
      {success ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={22} className="shrink-0 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Password reset complete</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
              Your password has been reset successfully. Redirecting you to sign in...
            </p>
          </div>

          <Link
            to="/login"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Go to sign in now
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              New Password
            </label>

            <PasswordField
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter new password (min. 6 chars)"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Confirm New Password
            </label>

            <PasswordField
              id="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Resetting password...
              </>
            ) : (
              <>
                Reset password
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
