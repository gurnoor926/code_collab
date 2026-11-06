
import { Code2, Terminal, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-[#09090f] text-white lg:grid lg:grid-cols-2">

      {/* Left branding panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0d0d18] p-12 lg:flex">

        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500">
            <Code2 size={25} />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Code<span className="text-indigo-400">Collab</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-300">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            Collaborative coding starts here
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Think together.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Code together.
            </span>
            <br />
            Succeed together.
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            A collaborative space for technical interviews,
            coding challenges and real-time problem solving.
          </p>

          <div className="mt-12 space-y-5">
            {[
              {
                icon: Terminal,
                title: "Powerful coding workspace",
                description: "Write and execute code in multiple languages.",
              },
              {
                icon: Users,
                title: "Real-time collaboration",
                description: "Work together in a shared interview room.",
              },
              {
                icon: ShieldCheck,
                title: "Structured evaluations",
                description: "Track performance with interview scorecards.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-indigo-400">
                  <item.icon size={21} />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-zinc-600">
          © 2026 CodeCollab. Built for better technical interviews.
        </p>
      </section>

      {/* Right form panel */}
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">

          <Link to="/" className="mb-12 flex items-center gap-2 lg:hidden">
            <Code2 className="text-indigo-400" size={28} />
            <span className="text-xl font-bold">
              Code<span className="text-indigo-400">Collab</span>
            </span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}

export default AuthLayout;
