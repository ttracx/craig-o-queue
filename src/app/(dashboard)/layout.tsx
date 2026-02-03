import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { 
  Zap, 
  LayoutDashboard, 
  Layers, 
  ListTodo, 
  Webhook, 
  Bell, 
  Settings,
  LogOut,
  Crown
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  const isPro = user.plan === "pro" && user.subscriptionStatus === "active";

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Craig-O-Queue</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />}>
            Dashboard
          </NavLink>
          <NavLink href="/queues" icon={<Layers className="w-5 h-5" />}>
            Queues
          </NavLink>
          <NavLink href="/jobs" icon={<ListTodo className="w-5 h-5" />}>
            Jobs
          </NavLink>
          <NavLink href="/webhooks" icon={<Webhook className="w-5 h-5" />} pro={!isPro}>
            Webhooks
          </NavLink>
          <NavLink href="/alerts" icon={<Bell className="w-5 h-5" />} pro={!isPro}>
            Alerts
          </NavLink>
          <NavLink href="/settings" icon={<Settings className="w-5 h-5" />}>
            Settings
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.name || "User"}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          {isPro ? (
            <div className="flex items-center gap-2 text-sm text-purple-400 mb-3">
              <Crown className="w-4 h-4" />
              Pro Plan
            </div>
          ) : (
            <Link
              href="/settings"
              className="block w-full py-2 text-center bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition mb-3"
            >
              Upgrade to Pro
            </Link>
          )}

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
  pro = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  pro?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
    >
      {icon}
      <span className="flex-1">{children}</span>
      {pro && (
        <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded font-medium">
          PRO
        </span>
      )}
    </Link>
  );
}
