import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JobStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Get counts by status
    const statusCounts = await prisma.job.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: true,
    });

    const statsByStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Jobs today
    const jobsToday = await prisma.job.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfDay },
      },
    });

    // Completed today
    const completedToday = await prisma.job.count({
      where: {
        userId: user.id,
        status: JobStatus.COMPLETED,
        completedAt: { gte: startOfDay },
      },
    });

    // Failed today
    const failedToday = await prisma.job.count({
      where: {
        userId: user.id,
        status: JobStatus.FAILED,
        completedAt: { gte: startOfDay },
      },
    });

    // Queue counts
    const queueCount = await prisma.queue.count({
      where: { userId: user.id },
    });

    // Jobs per day for the last 7 days
    const jobsByDay = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "Job"
      WHERE user_id = ${user.id}
        AND created_at >= ${startOfWeek}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Calculate success rate
    const totalCompleted = statsByStatus[JobStatus.COMPLETED] || 0;
    const totalFailed = statsByStatus[JobStatus.FAILED] || 0;
    const successRate = totalCompleted + totalFailed > 0
      ? Math.round((totalCompleted / (totalCompleted + totalFailed)) * 100)
      : 100;

    return NextResponse.json({
      stats: {
        total: Object.values(statsByStatus).reduce((a, b) => a + b, 0),
        pending: statsByStatus[JobStatus.PENDING] || 0,
        running: statsByStatus[JobStatus.RUNNING] || 0,
        completed: statsByStatus[JobStatus.COMPLETED] || 0,
        failed: statsByStatus[JobStatus.FAILED] || 0,
        scheduled: statsByStatus[JobStatus.SCHEDULED] || 0,
        retrying: statsByStatus[JobStatus.RETRYING] || 0,
        jobsToday,
        completedToday,
        failedToday,
        queueCount,
        successRate,
        jobsByDay: jobsByDay.map(row => ({
          date: row.date,
          count: Number(row.count),
        })),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
