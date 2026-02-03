"use client";

import { useState, useEffect } from "react";
import { Plus, Webhook, Trash2, Copy, Check } from "lucide-react";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  queueId: string | null;
  onComplete: boolean;
  onFail: boolean;
  onRetry: boolean;
  isActive: boolean;
  lastTriggered: string | null;
  queue: { name: string } | null;
}

interface Queue {
  id: string;
  name: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    queueId: "",
    onComplete: true,
    onFail: true,
    onRetry: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWebhooks();
    fetchQueues();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      
      if (res.status === 403) {
        setError("Webhooks require Pro plan");
        setWebhooks([]);
        return;
      }
      
      setWebhooks(data.webhooks || []);
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
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

  const createWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWebhook,
          queueId: newWebhook.queueId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create webhook");
      }

      fetchWebhooks();
      setShowModal(false);
      setNewWebhook({ name: "", url: "", queueId: "", onComplete: true, onFail: true, onRetry: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook");
    }
  };

  const copySecret = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Webhooks</h1>
          <p className="text-gray-400 mt-1">Get notified when jobs complete or fail</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          New Webhook
        </button>
      </div>

      {error && !loading && (
        <div className="bg-purple-500/20 border border-purple-500 rounded-xl p-6 text-center">
          <Webhook className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Pro Feature</h3>
          <p className="text-gray-400 mb-4">
            Webhooks require a Pro subscription. Upgrade to get notified when jobs complete or fail.
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
      ) : !error && webhooks.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <Webhook className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No webhooks yet</h3>
          <p className="text-gray-400 mb-4">Create a webhook to get notified about job events</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Create Webhook
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                  <p className="text-sm text-gray-400 font-mono mt-1">{webhook.url}</p>
                  {webhook.queue && (
                    <p className="text-xs text-gray-500 mt-1">Queue: {webhook.queue.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {webhook.secret && (
                    <button
                      onClick={() => copySecret(webhook.id, webhook.secret!)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      title="Copy secret"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {webhook.onComplete && (
                  <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                    On Complete
                  </span>
                )}
                {webhook.onFail && (
                  <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                    On Fail
                  </span>
                )}
                {webhook.onRetry && (
                  <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded">
                    On Retry
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Webhook</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={createWebhook}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="My Webhook"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="https://example.com/webhook"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Queue (optional)</label>
                <select
                  value={newWebhook.queueId}
                  onChange={(e) => setNewWebhook({ ...newWebhook, queueId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">All queues</option>
                  {queues.map((queue) => (
                    <option key={queue.id} value={queue.id}>{queue.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Trigger on</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newWebhook.onComplete}
                      onChange={(e) => setNewWebhook({ ...newWebhook, onComplete: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-300">Job completed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newWebhook.onFail}
                      onChange={(e) => setNewWebhook({ ...newWebhook, onFail: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-300">Job failed</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newWebhook.onRetry}
                      onChange={(e) => setNewWebhook({ ...newWebhook, onRetry: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-gray-300">Job retrying</span>
                  </label>
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
