import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

const DEFAULT_SETTINGS_ID = "default";

export async function GET() {
  try {
    let settings = await db.settings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await db.settings.create({
        data: {
          id: DEFAULT_SETTINGS_ID,
        },
      });
    }

    // Mask sensitive fields in response
    return NextResponse.json({
      ...settings,
      smtpPass: settings.smtpPass ? "********" : "",
      aiApiKey: settings.aiApiKey ? "********" : "",
    });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return errorResponse("Failed to get settings");
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Ensure settings record exists
    const existing = await db.settings.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
    });

    if (!existing) {
      await db.settings.create({
        data: { id: DEFAULT_SETTINGS_ID },
      });
    }

    // Don't overwrite secrets with the masked placeholder
    const updateData: Record<string, unknown> = {};

    if (body.smtpHost !== undefined) updateData.smtpHost = body.smtpHost;
    if (body.smtpPort !== undefined) updateData.smtpPort = body.smtpPort;
    if (body.smtpUser !== undefined) updateData.smtpUser = body.smtpUser;
    if (body.smtpPass !== undefined && body.smtpPass !== "********") {
      updateData.smtpPass = body.smtpPass;
    }
    if (body.fromEmail !== undefined) updateData.fromEmail = body.fromEmail;
    if (body.fromName !== undefined) updateData.fromName = body.fromName;
    if (body.dailySendLimit !== undefined)
      updateData.dailySendLimit = body.dailySendLimit;
    if (body.aiApiKey !== undefined && body.aiApiKey !== "********") {
      updateData.aiApiKey = body.aiApiKey;
    }
    if (body.aiProvider !== undefined) updateData.aiProvider = body.aiProvider;

    const settings = await db.settings.update({
      where: { id: DEFAULT_SETTINGS_ID },
      data: updateData,
    });

    return NextResponse.json({
      ...settings,
      smtpPass: settings.smtpPass ? "********" : "",
      aiApiKey: settings.aiApiKey ? "********" : "",
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return errorResponse("Failed to update settings");
  }
}
