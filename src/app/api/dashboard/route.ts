import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    // Calculate the start of this week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalCompanies,
      totalContacts,
      totalEmails,
      emailsSentThisWeek,
      emailsOpened,
      emailsReplied,
      emailsSentTotal,
      companiesByFundingStage,
    ] = await Promise.all([
      db.company.count(),
      db.contact.count(),
      db.email.count(),
      db.email.count({
        where: {
          status: "sent",
          sentAt: { gte: weekStart },
        },
      }),
      db.email.count({
        where: {
          openedAt: { not: null },
        },
      }),
      db.email.count({
        where: {
          repliedAt: { not: null },
        },
      }),
      db.email.count({
        where: {
          status: "sent",
        },
      }),
      // Pipeline stages: group companies by funding stage
      db.company.groupBy({
        by: ["fundingStage"],
        _count: { id: true },
        where: {
          fundingStage: { not: "" },
        },
      }),
    ]);

    // Calculate rates (avoid division by zero)
    const openRate =
      emailsSentTotal > 0
        ? Math.round((emailsOpened / emailsSentTotal) * 100)
        : 0;
    const replyRate =
      emailsSentTotal > 0
        ? Math.round((emailsReplied / emailsSentTotal) * 100)
        : 0;

    // Format pipeline stages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipelineStages = companiesByFundingStage.map((group: any) => ({
      stage: group.fundingStage || "Unknown",
      count: group._count.id,
    }));

    return NextResponse.json({
      totalCompanies,
      totalContacts,
      totalEmails,
      emailsSentThisWeek,
      emailsSentTotal,
      emailsOpened,
      emailsReplied,
      openRate,
      replyRate,
      pipelineStages,
    });
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    return errorResponse("Failed to get dashboard stats");
  }
}
