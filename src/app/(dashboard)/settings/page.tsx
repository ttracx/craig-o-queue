"use client";

import { useState, useEffect } from "react";
import { Crown, CreditCard, Key, Copy, Check, Plus, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  subscriptionStatus: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchApiKeys();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      setApiKeys(data.keys || []);
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create portal:", err);
    }
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.key) {
        setNewKey(data.key.key);
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      fetchApiKeys();
    } catch (err) {
      console.error("Failed to delete API key:", err);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPro = user?.plan === "pro" && user?.subscriptionStatus === "active";

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and subscription</p>
      </div>

      <div className="space-y-6">
        {/* Subscription */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Subscription</h2>
              <p className="text-sm text-gray-400">
                Current plan: <span className="text-purple-400 font-medium">{isPro ? "Pro" : "Free"}</span>
              </p>
            </div>
          </div>

          {isPro ? (
            <div>
              <p className="text-gray-400 mb-4">
                You have access to all Pro features including unlimited jobs, webhooks, and failure alerts.
              </p>
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                <CreditCard className="w-5 h-5" />
                Manage Subscription
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">
                Upgrade to Pro for unlimited jobs, webhooks, priority queues, and failure alerts.
              </p>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Pro Plan</p>
                    <p className="text-sm text-gray-400">Everything you need to manage jobs at scale</p>
                  </div>
                  <p className="text-2xl font-bold text-white">$19<span className="text-sm text-gray-400">/mo</span></p>
                </div>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {upgrading ? "Loading..." : "Upgrade to Pro"}
              </button>
            </div>
          )}
        </div>

        {/* API Keys */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">API Keys</h2>
                <p className="text-sm text-gray-400">Manage your API keys for programmatic access</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No API keys yet</p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{apiKey.name}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {apiKey.key.slice(0, 12)}...{apiKey.key.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyKey(apiKey.key)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-700 rounded transition"
                    >
                      {copiedKey === apiKey.key ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
            {newKey ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-4">API Key Created</h2>
                <p className="text-gray-400 mb-4">
                  Copy your API key now. You won&apos;t be able to see it again.
                </p>
                <div className="flex items-center gap-2 p-3 bg-slate-700 rounded-lg mb-4">
                  <code className="flex-1 text-sm text-green-400 font-mono break-all">{newKey}</code>
                  <button
                    onClick={() => copyKey(newKey)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-600 rounded transition"
                  >
                    {copiedKey === newKey ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setNewKey(null);
                    setNewKeyName("");
                  }}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white mb-4">Create API Key</h2>
                <form onSubmit={createApiKey}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="My API Key"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewKeyModal(false)}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
