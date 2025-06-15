import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { z } from "zod";

// Validation schema for revocation
const revocationSchema = z.object({
  reason: z.string().min(1, "Revocation reason is required"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check authorization (only admin and staff can revoke certificates)
    if (!["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = revocationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { reason } = validationResult.data;

    // Find certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    // Check if certificate is already revoked
    if (certificate.status === "REVOKED") {
      return NextResponse.json(
        { success: false, message: "Certificate is already revoked" },
        { status: 400 }
      );
    }

    // Staff can only revoke certificates they issued
    if (
      session.user.role === "STAFF" &&
      certificate.issuerId !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only revoke certificates you issued",
        },
        { status: 403 }
      );
    }

    // Revoke certificate
    const updatedCertificate = await prisma.certificate.update({
      where: { id },
      data: {
        status: "REVOKED",
        revocationReason: reason,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "REVOKE",
        entityId: certificate.id,
        entityType: "CERTIFICATE",
        userId: session.user.id,
        metadata: {
          certificateId: certificate.certificateId,
          recipientId: certificate.recipientId,
          reason,
        },
      },
    });

    logger.info(
      {
        certificateId: certificate.certificateId,
        reason,
        revokedBy: session.user.id,
      },
      "Certificate revoked successfully"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Certificate revoked successfully",
        certificate: {
          id: updatedCertificate.id,
          certificateId: certificate.certificateId,
          status: updatedCertificate.status,
          revocationReason: updatedCertificate.revocationReason,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "Error revoking certificate");
    return NextResponse.json(
      { success: false, message: "Error revoking certificate" },
      { status: 500 }
    );
  }
}