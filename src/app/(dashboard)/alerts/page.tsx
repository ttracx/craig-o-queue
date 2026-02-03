"use client";

import { useState, useEffect } from "react";
import { Plus, Bell, Trash2 } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  channel: string;
  destination: string;
  threshold: number;
  windowMinutes: number;
  isActive: boolean;
  lastSent: string | null;
}

const alertTypes = [
  { value: "JOB_FAILED", label: "Job Failed" },
  { value: "QUEUE_STALLED", label: "Queue Stalled" },
  { value: "HIGH_FAILURE_RATE", label: "High Failure Rate" },
  { value: "JOB_TIMEOUT", label: "Job Timeout" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: "JOB_FAILED",
    channel: "webhook",
    destination: "",
    threshold: 1,
    windowMinutes: 60,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      
      if (res.status === 403) {
        setError("Failure alerts require Pro plan");
        setAlerts([]);
        return;
      }
      
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAlert),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create alert");
      }

      fetchAlerts();
      setShowModal(false);
      setNewAlert({ type: "JOB_FAILED", channel: "webhook", destination: "", threshold: 1, windowMinutes: 60 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Failure Alerts</h1>
          <p className="text-gray-400 mt-1">Get notified when things go wrong</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          New Alert
        </button>
      </div>

      {error && !loading && (
        <div className="bg-purple-500/20 border border-purple-500 rounded-xl p-6 text-center">
          <Bell className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Pro Feature</h3>
          <p className="text-gray-400 mb-4">
            Failure alerts require a Pro subscription. Upgrade to get notified when jobs fail.
          </p>
          <a
            href="/settings"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Upgrade to Pro
          </a>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : !error && alerts.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No alerts yet</h3>
          <p className="text-gray-400 mb-4">Create an alert to get notified about failures</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Create Alert
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {alertTypes.find(t => t.value === alert.type)?.label || alert.type}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Alert via {alert.channel} to {alert.destination}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Triggers after {alert.threshold} failure(s) within {alert.windowMinutes} minutes
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${alert.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {alert.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Alert</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={createAlert}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Alert Type</label>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {alertTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Channel</label>
                <select
                  value={newAlert.channel}
                  onChange={(e) => setNewAlert({ ...newAlert, channel: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="webhook">Webhook</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {newAlert.channel === "email" ? "Email Address" : "Webhook URL"}
                </label>
                <input
                  type={newAlert.channel === "email" ? "email" : "url"}
                  value={newAlert.destination}
                  onChange={(e) => setNewAlert({ ...newAlert, destination: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder={newAlert.channel === "email" ? "alerts@example.com" : "https://example.com/alerts"}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Threshold</label>
                  <input
                    type="number"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Window (minutes)</label>
                  <input
                    type="number"
                    value={newAlert.windowMinutes}
                    onChange={(e) => setNewAlert({ ...newAlert, windowMinutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    min={1}
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
