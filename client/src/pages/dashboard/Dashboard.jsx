import { useAuth } from "../../hooks/useAuth";

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8 text-text-primary">
      <h1 className="text-3xl font-bold">
        Welcome, {user?.name}
      </h1>

      <p className="mt-2 text-text-secondary">
        Role: {user?.role}
      </p>

      <button
        onClick={logout}
        className="mt-6 rounded-lg bg-primary px-5 py-2 text-white hover:bg-primary-dark"
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;