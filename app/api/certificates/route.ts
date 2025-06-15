import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Validation schema for certificate creation
const certificateSchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  templateId: z.string().min(1, "Template ID is required"),
  title: z.string().min(1, "Title is required"),
  expiryDate: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check authorization (only admin and staff can create certificates)
    if (!["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = certificateSchema.safeParse(body);

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

    const { recipientId, templateId, title, expiryDate, metadata } = validationResult.data;

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: "Recipient not found" },
        { status: 404 }
      );
    }

    // Check if template exists and is active
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, message: "Template not found" },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { success: false, message: "Template is not active" },
        { status: 400 }
      );
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        certificateId,
        recipientId,
        issuerId: session.user.id,
        templateId,
        title,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        metadata: metadata || {},
        status: "ACTIVE",
      },
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
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityId: certificate.id,
        entityType: "CERTIFICATE",
        userId: session.user.id,
        metadata: {
          certificateId: certificate.certificateId,
          recipientId,
          templateId,
        },
      },
    });

    logger.info(
      {
        certificateId: certificate.certificateId,
        recipientId,
        issuerId: session.user.id,
      },
      "Certificate created successfully"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Certificate created successfully",
        certificate: {
          id: certificate.id,
          certificateId: certificate.certificateId,
          title: certificate.title,
          recipientName: certificate.recipient.name,
          issuerName: certificate.issuer.name,
          templateName: certificate.template.name,
          issueDate: certificate.issueDate,
          expiryDate: certificate.expiryDate,
          status: certificate.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error }, "Error creating certificate");
    return NextResponse.json(
      { success: false, message: "Error creating certificate" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as "ACTIVE" | "EXPIRED" | "REVOKED" | undefined;
    const templateId = searchParams.get("templateId") || undefined;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by template if provided
    if (templateId) {
      where.templateId = templateId;
    }

    // Filter by search term if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { certificateId: { contains: search, mode: "insensitive" } },
        { recipient: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Apply role-based access control
    if (session.user.role === "STUDENT") {
      // Students can only see their own certificates
      where.recipientId = session.user.id;
    } else if (session.user.role === "STAFF") {
      // Staff can see certificates they issued or all certificates if they're an admin
      where.issuerId = session.user.id;
    }
    // Admins can see all certificates (no additional filter)

    // Get certificates with pagination - optimized query
    const [certificates, total] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          c.id, 
          c."certificateId", 
          c.title, 
          c."issueDate", 
          c."expiryDate", 
          c.status,
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
        WHERE ${where.status ? prisma.sql`c.status = ${where.status}` : prisma.sql`1=1`}
          ${where.recipientId ? prisma.sql`AND c."recipientId" = ${where.recipientId}` : prisma.sql``}
          ${where.issuerId ? prisma.sql`AND c."issuerId" = ${where.issuerId}` : prisma.sql``}
        ORDER BY c."issueDate" DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.certificate.count({ where }),
    ]);

    // Format response for optimized query
    const formattedCertificates = certificates.map((cert) => ({
      id: cert.id,
      certificateId: cert.certificateId,
      title: cert.title,
      recipientName: cert.recipientName,
      recipientEmail: cert.recipientEmail,
      issuerName: cert.issuerName,
      templateName: cert.templateName,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
    }));

    return NextResponse.json(
      {
        success: true,
        certificates: formattedCertificates,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, "Error fetching certificates");
    return NextResponse.json(
      { success: false, message: "Error fetching certificates" },
      { status: 500 }
    );
  }
}