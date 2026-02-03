import Link from "next/link";
import { getSession } from "@/lib/auth";
import { 
  Zap, 
  RefreshCw, 
  ArrowUpDown, 
  Activity, 
  Webhook, 
  Bell, 
  Check 
} from "lucide-react";

export default async function HomePage() {
  const user = await getSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Craig-O-Queue</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2 text-white hover:text-purple-300 transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Job Queues,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Simplified
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Powerful job queue management with scheduling, retry logic, priority queues, 
          webhook triggers, and real-time monitoring. Built for developers who ship fast.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
          >
            Start Free Trial
          </Link>
          <Link
            href="#features"
            className="px-8 py-4 border border-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-purple-500/20 transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Everything you need to manage jobs at scale
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Job Scheduling"
            description="Schedule jobs to run at specific times or intervals. Cron-like scheduling made simple."
          />
          <FeatureCard
            icon={<RefreshCw className="w-8 h-8" />}
            title="Smart Retry Logic"
            description="Automatic retries with exponential backoff. Configure retry limits per job or queue."
          />
          <FeatureCard
            icon={<ArrowUpDown className="w-8 h-8" />}
            title="Priority Queues"
            description="Assign priorities to jobs. Critical jobs jump ahead in the queue automatically."
          />
          <FeatureCard
            icon={<Activity className="w-8 h-8" />}
            title="Real-time Monitoring"
            description="Beautiful dashboard with live updates. Track job progress, success rates, and throughput."
          />
          <FeatureCard
            icon={<Webhook className="w-8 h-8" />}
            title="Webhook Triggers"
            description="Get notified when jobs complete, fail, or retry. Integrate with any service."
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8" />}
            title="Failure Alerts"
            description="Set up alerts for job failures. Know instantly when something goes wrong."
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Start free, upgrade when you need more
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <p className="text-gray-400 mb-4">For hobby projects</p>
            <div className="text-4xl font-bold text-white mb-6">
              $0<span className="text-lg text-gray-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <PricingFeature>100 jobs/month</PricingFeature>
              <PricingFeature>1 queue</PricingFeature>
              <PricingFeature>Basic monitoring</PricingFeature>
              <PricingFeature>Community support</PricingFeature>
            </ul>
            <Link
              href="/signup"
              className="block w-full py-3 text-center border border-purple-500 text-white rounded-lg hover:bg-purple-500/20 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <p className="text-gray-400 mb-4">For production apps</p>
            <div className="text-4xl font-bold text-white mb-6">
              $19<span className="text-lg text-gray-400">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <PricingFeature>Unlimited jobs</PricingFeature>
              <PricingFeature>Unlimited queues</PricingFeature>
              <PricingFeature>Priority queues</PricingFeature>
              <PricingFeature>Webhook triggers</PricingFeature>
              <PricingFeature>Failure alerts</PricingFeature>
              <PricingFeature>API access</PricingFeature>
              <PricingFeature>Priority support</PricingFeature>
            </ul>
            <Link
              href="/signup?plan=pro"
              className="block w-full py-3 text-center bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Craig-O-Queue</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 VibeCaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition">
      <div className="w-14 h-14 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-gray-300">
      <Check className="w-5 h-5 text-purple-400" />
      {children}
    </li>
  );
}
