import { prisma } from "./db";
import { JobStatus } from "@prisma/client";

export interface JobPayload {
  type: string;
  data: Record<string, unknown>;
  webhookUrl?: string;
}

export interface CreateJobOptions {
  name: string;
  queueId: string;
  userId: string;
  payload: JobPayload;
  priority?: number;
  scheduledAt?: Date;
  maxRetries?: number;
  webhookUrl?: string;
}

export async function createJob(options: CreateJobOptions) {
  const job = await prisma.job.create({
    data: {
      name: options.name,
      queueId: options.queueId,
      userId: options.userId,
      payload: options.payload as object,
      priority: options.priority ?? 0,
      scheduledAt: options.scheduledAt,
      maxRetries: options.maxRetries ?? 3,
      webhookUrl: options.webhookUrl,
      status: options.scheduledAt ? JobStatus.SCHEDULED : JobStatus.PENDING,
    },
    include: {
      queue: true,
    },
  });

  await addJobLog(job.id, "INFO", `Job created: ${options.name}`);

  return job;
}

export async function startJob(jobId: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  await addJobLog(jobId, "INFO", "Job started");
  return job;
}

export async function completeJob(jobId: string, result?: Record<string, unknown>) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      progress: 100,
      result: result as object,
    },
    include: {
      queue: {
        include: {
          webhooks: true,
        },
      },
    },
  });

  await addJobLog(jobId, "INFO", "Job completed successfully");

  // Trigger webhooks
  await triggerWebhooks(job, "completed");

  return job;
}

export async function failJob(jobId: string, error: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      queue: {
        include: {
          webhooks: true,
        },
      },
    },
  });

  if (!job) throw new Error("Job not found");

  const shouldRetry = job.attempts < job.maxRetries;

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: shouldRetry ? JobStatus.RETRYING : JobStatus.FAILED,
      lastError: error,
      attempts: job.attempts + 1,
      completedAt: shouldRetry ? null : new Date(),
    },
    include: {
      queue: {
        include: {
          webhooks: true,
        },
      },
    },
  });

  await addJobLog(
    jobId,
    "ERROR",
    shouldRetry
      ? `Job failed (attempt ${job.attempts + 1}/${job.maxRetries}), will retry: ${error}`
      : `Job failed permanently: ${error}`
  );

  if (shouldRetry) {
    // Schedule retry with exponential backoff
    const delay = Math.min(job.queue.retryDelay * Math.pow(2, job.attempts), 3600000);
    await scheduleRetry(jobId, delay);
    await triggerWebhooks(updatedJob, "retry");
  } else {
    await triggerWebhooks(updatedJob, "failed");
    await checkFailureAlerts(job.userId, job.queueId);
  }

  return updatedJob;
}

export async function scheduleRetry(jobId: string, delayMs: number) {
  const scheduledAt = new Date(Date.now() + delayMs);
  
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.SCHEDULED,
      scheduledAt,
    },
  });

  await addJobLog(jobId, "INFO", `Retry scheduled for ${scheduledAt.toISOString()}`);
}

export async function cancelJob(jobId: string) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.CANCELLED,
      completedAt: new Date(),
    },
  });

  await addJobLog(jobId, "WARN", "Job cancelled");
  return job;
}

export async function updateJobProgress(jobId: string, progress: number) {
  await prisma.job.update({
    where: { id: jobId },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  });
}

export async function addJobLog(
  jobId: string,
  level: "DEBUG" | "INFO" | "WARN" | "ERROR",
  message: string,
  metadata?: Record<string, unknown>
) {
  await prisma.jobLog.create({
    data: {
      jobId,
      level,
      message,
      metadata: metadata as object,
    },
  });
}

export async function getNextJobs(limit = 10) {
  const now = new Date();

  return prisma.job.findMany({
    where: {
      OR: [
        { status: JobStatus.PENDING },
        {
          status: JobStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
      ],
      queue: {
        isPaused: false,
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      queue: true,
    },
  });
}

async function triggerWebhooks(
  job: Awaited<ReturnType<typeof prisma.job.findUnique>> & {
    queue: { webhooks: Array<{ url: string; secret: string | null; onComplete: boolean; onFail: boolean; onRetry: boolean; isActive: boolean }> };
  },
  event: "completed" | "failed" | "retry"
) {
  if (!job) return;

  // Job-specific webhook
  if (job.webhookUrl) {
    await sendWebhook(job.webhookUrl, null, job, event);
  }

  // Queue webhooks
  for (const webhook of job.queue.webhooks) {
    if (!webhook.isActive) continue;
    if (event === "completed" && !webhook.onComplete) continue;
    if (event === "failed" && !webhook.onFail) continue;
    if (event === "retry" && !webhook.onRetry) continue;

    await sendWebhook(webhook.url, webhook.secret, job, event);
  }
}

async function sendWebhook(
  url: string,
  secret: string | null,
  job: { id: string; name: string; status: JobStatus; result?: unknown; lastError?: string | null },
  event: string
) {
  try {
    const payload = {
      event,
      job: {
        id: job.id,
        name: job.name,
        status: job.status,
        result: job.result,
        error: job.lastError,
      },
      timestamp: new Date().toISOString(),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (secret) {
      const crypto = await import("crypto");
      const signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");
      headers["X-Webhook-Signature"] = signature;
    }

    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`Failed to send webhook to ${url}:`, error);
  }
}

async function checkFailureAlerts(userId: string, queueId: string) {
  const alerts = await prisma.alert.findMany({
    where: {
      userId,
      isActive: true,
      type: "JOB_FAILED",
    },
  });

  for (const alert of alerts) {
    const windowStart = new Date(Date.now() - alert.windowMinutes * 60 * 1000);
    
    const failureCount = await prisma.job.count({
      where: {
        userId,
        queueId,
        status: JobStatus.FAILED,
        completedAt: { gte: windowStart },
      },
    });

    if (failureCount >= alert.threshold) {
      // Check if we've sent recently
      if (alert.lastSent && new Date(alert.lastSent).getTime() > windowStart.getTime()) {
        continue;
      }

      // Send alert
      if (alert.channel === "webhook" && alert.destination) {
        await fetch(alert.destination, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "JOB_FAILED",
            message: `${failureCount} jobs failed in the last ${alert.windowMinutes} minutes`,
            timestamp: new Date().toISOString(),
          }),
        });
      }

      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastSent: new Date() },
      });
    }
  }
}
