import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-text-primary">
      <h1 className="text-5xl font-bold">403</h1>
      <p className="mt-3 text-text-secondary">
        You don't have permission to access this page.
      </p>
      <Link to="/dashboard" className="mt-5 text-primary hover:underline">
        Return to Dashboard
      </Link>
    </div>
  );
}

export default Unauthorized;