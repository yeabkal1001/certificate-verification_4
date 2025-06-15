import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { getToken } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateId } = body;

    if (!certificateId) {
      return NextResponse.json(
        { success: false, message: "Certificate ID is required" },
        { status: 400 }
      );
    }

    // Get user token if available (optional for verification)
    const token = await getToken({ req: request });
    const userId = token?.sub;

    // Get client IP and user agent for logging
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    logger.info({ certificateId, ip }, "Certificate verification request");

    // Find certificate by public ID - optimized query
    const certificates = await prisma.$queryRaw`
      SELECT 
        c.id, 
        c."certificateId", 
        c.title, 
        c."issueDate", 
        c."expiryDate", 
        c.status,
        c."revocationReason",
        c.metadata,
        r.id as "recipientId", 
        r.name as "recipientName", 
        r.email as "recipientEmail",
        i.id as "issuerId", 
        i.name as "issuerName", 
        i.role as "issuerRole",
        t.id as "templateId", 
        t.name as "templateName"
      FROM "Certificate" c
      JOIN "User" r ON c."recipientId" = r.id
      JOIN "User" i ON c."issuerId" = i.id
      JOIN "Template" t ON c."templateId" = t.id
      WHERE c."certificateId" = ${certificateId}
      LIMIT 1
    `;
    
    // Extract certificate from result array
    const certificate = certificates.length > 0 ? certificates[0] : null;

    // Create verification log entry
    const verificationLog = await prisma.verificationLog.create({
      data: {
        certificateId: certificate?.id || "invalid-id",
        verifierId: userId || null,
        ipAddress: ip,
        userAgent,
        isValid: !!certificate && certificate.status === "ACTIVE",
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "VERIFY",
        entityId: certificate?.id || certificateId,
        entityType: "CERTIFICATE",
        userId: userId || null,
        ipAddress: ip,
        metadata: {
          certificateId,
          verificationLogId: verificationLog.id,
          result: !!certificate && certificate.status === "ACTIVE",
        },
      },
    });

    // If certificate not found
    if (!certificate) {
      logger.info({ certificateId }, "Certificate not found");
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          message: "Certificate not found",
          verificationDate: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Check if certificate is active
    if (certificate.status !== "ACTIVE") {
      logger.info({ certificateId, status: certificate.status }, "Certificate is not active");
      return NextResponse.json(
        {
          success: true,
          isValid: false,
          message: certificate.status === "REVOKED" 
            ? `Certificate has been revoked. Reason: ${certificate.revocationReason || "Not specified"}` 
            : "Certificate has expired",
          verificationDate: new Date().toISOString(),
          certificate: {
            id: certificate.certificateId,
            status: certificate.status,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
          },
        },
        { status: 200 }
      );
    }

    // Check if certificate is expired
    if (certificate.expiryDate && new Date(certificate.expiryDate) < new Date()) {
      // Update certificate status to EXPIRED
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { status: "EXPIRED" },
      });

      logger.info({ certificateId }, "Certificate has expired");
      return NextResponse.json(
        {
          success: true,
          isValid: false,
          message: "Certificate has expired",
          verificationDate: new Date().toISOString(),
          certificate: {
            id: certificate.certificateId,
            status: "EXPIRED",
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
          },
        },
        { status: 200 }
      );
    }

    // Certificate is valid
    logger.info({ certificateId }, "Certificate verified successfully");
    return NextResponse.json(
      {
        success: true,
        isValid: true,
        message: "Certificate is valid",
        verificationDate: new Date().toISOString(),
        certificate: {
          id: certificate.certificateId,
          title: certificate.title,
          recipientName: certificate.recipientName,
          issuerName: certificate.issuerName,
          templateName: certificate.templateName,
          issueDate: certificate.issueDate,
          expiryDate: certificate.expiryDate,
          status: certificate.status,
          metadata: certificate.metadata,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "Error verifying certificate");
    return NextResponse.json(
      { success: false, message: "Error verifying certificate" },
      { status: 500 }
    );
  }
}
