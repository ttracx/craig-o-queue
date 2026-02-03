"use client";

import { useState, useEffect } from "react";
import { Plus, ListTodo, Play, XCircle, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  name: string;
  status: string;
  priority: number;
  progress: number;
  attempts: number;
  maxRetries: number;
  lastError: string | null;
  scheduledAt: string | null;
  createdAt: string;
  queue: { name: string };
}

interface Queue {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SCHEDULED: "bg-purple-500/20 text-purple-400",
  RUNNING: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  FAILED: "bg-red-500/20 text-red-400",
  CANCELLED: "bg-gray-500/20 text-gray-400",
  RETRYING: "bg-orange-500/20 text-orange-400",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ status: "", queueId: "" });
  const [newJob, setNewJob] = useState({
    name: "",
    queueId: "",
    payload: "{}",
    priority: 0,
    scheduledAt: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchQueues();
  }, [filter]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.queueId) params.set("queueId", filter.queueId);

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async () => {
    try {
      const res = await fetch("/api/queues");
      const data = await res.json();
      setQueues(data.queues || []);
    } catch (err) {
      console.error("Failed to fetch queues:", err);
    }
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let payload;
      try {
        payload = JSON.parse(newJob.payload);
      } catch {
        throw new Error("Invalid JSON payload");
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newJob,
          payload: { type: "custom", data: payload },
          scheduledAt: newJob.scheduledAt || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job");
      }

      fetchJobs();
      setShowModal(false);
      setNewJob({ name: "", queueId: "", payload: "{}", priority: 0, scheduledAt: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    }
  };

  const updateJob = async (id: string, action: string) => {
    try {
      await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchJobs();
    } catch (err) {
      console.error("Failed to update job:", err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs</h1>
          <p className="text-gray-400 mt-1">Monitor and manage your jobs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          disabled={queues.length === 0}
        >
          <Plus className="w-5 h-5" />
          New Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="RUNNING">Running</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="RETRYING">Retrying</option>
        </select>

        <select
          value={filter.queueId}
          onChange={(e) => setFilter({ ...filter, queueId: e.target.value })}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All Queues</option>
          {queues.map((queue) => (
            <option key={queue.id} value={queue.id}>{queue.name}</option>
          ))}
        </select>

        <button
          onClick={fetchJobs}
          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <ListTodo className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
          <p className="text-gray-400">
            {queues.length === 0
              ? "Create a queue first to start adding jobs"
              : "Create your first job to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Queue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{job.name}</p>
                      <p className="text-xs text-gray-400">
                        {job.priority > 0 && `Priority ${job.priority} • `}
                        {job.attempts > 0 && `Attempt ${job.attempts}/${job.maxRetries}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{job.queue.name}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2 py-1 text-xs rounded-full", statusColors[job.status])}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{job.progress}%</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {job.status === "PENDING" && (
                        <button
                          onClick={() => updateJob(job.id, "start")}
                          className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-slate-700 rounded transition"
                          title="Start"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {job.status === "RUNNING" && (
                        <>
                          <button
                            onClick={() => updateJob(job.id, "complete")}
                            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-slate-700 rounded transition"
                            title="Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateJob(job.id, "fail")}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                            title="Fail"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {["PENDING", "SCHEDULED", "RUNNING"].includes(job.status) && (
                        <button
                          onClick={() => updateJob(job.id, "cancel")}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Job</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={createJob}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="send-email"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Queue</label>
                <select
                  value={newJob.queueId}
                  onChange={(e) => setNewJob({ ...newJob, queueId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select a queue</option>
                  {queues.map((queue) => (
                    <option key={queue.id} value={queue.id}>{queue.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Payload (JSON)</label>
                <textarea
                  value={newJob.payload}
                  onChange={(e) => setNewJob({ ...newJob, payload: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                  rows={4}
                  placeholder='{"email": "user@example.com"}'
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <input
                    type="number"
                    value={newJob.priority}
                    onChange={(e) => setNewJob({ ...newJob, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Schedule (optional)</label>
                  <input
                    type="datetime-local"
                    value={newJob.scheduledAt}
                    onChange={(e) => setNewJob({ ...newJob, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
