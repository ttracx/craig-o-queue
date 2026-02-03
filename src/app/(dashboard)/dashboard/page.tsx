import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JobStatus } from "@prisma/client";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Get stats
  const [
    totalJobs,
    completedJobs,
    failedJobs,
    pendingJobs,
    queueCount,
    recentJobs,
  ] = await Promise.all([
    prisma.job.count({ where: { userId: user.id } }),
    prisma.job.count({ where: { userId: user.id, status: JobStatus.COMPLETED } }),
    prisma.job.count({ where: { userId: user.id, status: JobStatus.FAILED } }),
    prisma.job.count({ where: { userId: user.id, status: JobStatus.PENDING } }),
    prisma.queue.count({ where: { userId: user.id } }),
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { queue: { select: { name: true } } },
    }),
  ]);

  const successRate = completedJobs + failedJobs > 0
    ? Math.round((completedJobs / (completedJobs + failedJobs)) * 100)
    : 100;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Welcome back, {user.name || "there"}! Here&apos;s your queue overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="Total Jobs"
          value={totalJobs}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Completed"
          value={completedJobs}
          color="green"
        />
        <StatCard
          icon={<XCircle className="w-6 h-6" />}
          label="Failed"
          value={failedJobs}
          color="red"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Pending"
          value={pendingJobs}
          color="yellow"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Success Rate & Queues */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{successRate}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">All time</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Active Queues</p>
                  <p className="text-2xl font-bold text-white">{queueCount}</p>
                </div>
              </div>
              <Link
                href="/queues"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
            <Link
              href="/jobs"
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              View all →
            </Link>
          </div>

          {recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={job.status} />
                    <div>
                      <p className="text-white font-medium">{job.name}</p>
                      <p className="text-xs text-gray-400">{job.queue.name}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(job.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No jobs yet. Create a queue and start adding jobs!
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Quick Start</h2>
        <p className="text-gray-400 mb-4">Get started with Craig-O-Queue</p>
        <div className="flex gap-4">
          <Link
            href="/queues"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Create Queue
          </Link>
          <Link
            href="/jobs"
            className="px-4 py-2 border border-purple-500 text-white rounded-lg hover:bg-purple-500/20 transition"
          >
            View Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "purple" | "green" | "red" | "yellow";
}) {
  const colors = {
    purple: "bg-purple-500/20 text-purple-400",
    green: "bg-green-500/20 text-green-400",
    red: "bg-red-500/20 text-red-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    PENDING: "bg-yellow-500",
    SCHEDULED: "bg-purple-500",
    RUNNING: "bg-blue-500",
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
    CANCELLED: "bg-gray-500",
    RETRYING: "bg-orange-500",
  };

  return (
    <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
