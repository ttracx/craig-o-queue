"use client";

import { useState, useEffect } from "react";
import { Plus, Layers, Play, Pause, Trash2, MoreVertical } from "lucide-react";

interface Queue {
  id: string;
  name: string;
  description: string | null;
  isPaused: boolean;
  maxRetries: number;
  retryDelay: number;
  createdAt: string;
  _count: { jobs: number };
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newQueue, setNewQueue] = useState({ name: "", description: "", maxRetries: 3, retryDelay: 60000 });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      const res = await fetch("/api/queues");
      const data = await res.json();
      setQueues(data.queues || []);
    } catch (err) {
      console.error("Failed to fetch queues:", err);
    } finally {
      setLoading(false);
    }
  };

  const createQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQueue),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create queue");
      }

      setQueues([data.queue, ...queues]);
      setShowModal(false);
      setNewQueue({ name: "", description: "", maxRetries: 3, retryDelay: 60000 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create queue");
    }
  };

  const togglePause = async (id: string, isPaused: boolean) => {
    try {
      await fetch(`/api/queues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: !isPaused }),
      });

      setQueues(queues.map(q => q.id === id ? { ...q, isPaused: !isPaused } : q));
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    }
  };

  const deleteQueue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this queue? All jobs will be deleted.")) {
      return;
    }

    try {
      await fetch(`/api/queues/${id}`, { method: "DELETE" });
      setQueues(queues.filter(q => q.id !== id));
    } catch (err) {
      console.error("Failed to delete queue:", err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Queues</h1>
          <p className="text-gray-400 mt-1">Manage your job queues</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          New Queue
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : queues.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <Layers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No queues yet</h3>
          <p className="text-gray-400 mb-4">Create your first queue to start managing jobs</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Create Queue
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {queues.map((queue) => (
            <div
              key={queue.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${queue.isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{queue.name}</h3>
                    {queue.isPaused && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {queue._count.jobs} jobs • Max {queue.maxRetries} retries
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePause(queue.id, queue.isPaused)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  title={queue.isPaused ? "Resume" : "Pause"}
                >
                  {queue.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => deleteQueue(queue.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Queue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Queue</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={createQueue}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newQueue.name}
                  onChange={(e) => setNewQueue({ ...newQueue, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="my-queue"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={newQueue.description}
                  onChange={(e) => setNewQueue({ ...newQueue, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Process email notifications"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Retries</label>
                  <input
                    type="number"
                    value={newQueue.maxRetries}
                    onChange={(e) => setNewQueue({ ...newQueue, maxRetries: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Retry Delay (ms)</label>
                  <input
                    type="number"
                    value={newQueue.retryDelay}
                    onChange={(e) => setNewQueue({ ...newQueue, retryDelay: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min={1000}
                    step={1000}
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
