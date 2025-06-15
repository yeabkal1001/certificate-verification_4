import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(
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
        issuer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            design: true,
          },
        },
        verificationLogs: {
          take: 10,
          orderBy: { timestamp: "desc" },
          select: {
            id: true,
            timestamp: true,
            ipAddress: true,
            userAgent: true,
            isValid: true,
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

    // Check authorization
    const isAdmin = session.user.role === "ADMIN";
    const isStaff = session.user.role === "STAFF";
    const isIssuer = certificate.issuerId === session.user.id;
    const isRecipient = certificate.recipientId === session.user.id;

    if (!isAdmin && !isStaff && !isRecipient) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Staff can only view certificates they issued unless they're admins
    if (isStaff && !isIssuer && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Format response
    const formattedCertificate = {
      id: certificate.id,
      certificateId: certificate.certificateId,
      title: certificate.title,
      recipient: {
        id: certificate.recipient.id,
        name: certificate.recipient.name,
        email: certificate.recipient.email,
      },
      issuer: {
        id: certificate.issuer.id,
        name: certificate.issuer.name,
        role: certificate.issuer.role,
      },
      template: {
        id: certificate.template.id,
        name: certificate.template.name,
        design: certificate.template.design,
      },
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      status: certificate.status,
      revocationReason: certificate.revocationReason,
      metadata: certificate.metadata,
      verificationLogs: isAdmin || isStaff ? certificate.verificationLogs : undefined,
      verificationCount: certificate.verificationLogs.length,
    };

    return NextResponse.json(
      {
        success: true,
        certificate: formattedCertificate,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "Error fetching certificate");
    return NextResponse.json(
      { success: false, message: "Error fetching certificate" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Only admins can delete certificates
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Find certificate
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      select: {
        id: true,
        certificateId: true,
        recipientId: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, message: "Certificate not found" },
        { status: 404 }
      );
    }

    // Delete certificate
    await prisma.certificate.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityId: certificate.id,
        entityType: "CERTIFICATE",
        userId: session.user.id,
        metadata: {
          certificateId: certificate.certificateId,
          recipientId: certificate.recipientId,
        },
      },
    });

    logger.info(
      {
        certificateId: certificate.certificateId,
        deletedBy: session.user.id,
      },
      "Certificate deleted successfully"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Certificate deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "Error deleting certificate");
    return NextResponse.json(
      { success: false, message: "Error deleting certificate" },
      { status: 500 }
    );
  }
}