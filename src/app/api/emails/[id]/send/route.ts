import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const email = await db.email.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            fullName: true,
            workEmail: true,
          },
        },
      },
    });

    if (!email) {
      return errorResponse("Email not found", 404);
    }

    if (email.status === "sent") {
      return errorResponse("Email has already been sent", 400);
    }

    if (!email.contact.workEmail) {
      return errorResponse("Contact does not have a work email address", 400);
    }

    // Placeholder: In the future, this will call the email engine (SMTP)
    // to actually send the email. For now, just update the status.
    const updatedEmail = await db.email.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      email: updatedEmail,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    return errorResponse("Failed to send email");
  }
}
