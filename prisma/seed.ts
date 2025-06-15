import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create default users
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('Admin user created:', admin.id);

  // Create staff user
  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      name: 'Staff Member',
      email: 'staff@example.com',
      password: staffPassword,
      role: UserRole.STAFF,
    },
  });
  console.log('Staff user created:', staff.id);

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      name: 'Almaz Tadesse',
      email: 'student@example.com',
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  });
  console.log('Student user created:', student.id);

  // Create default certificate template
  const template = await prisma.template.upsert({
    where: { id: 'default-template' },
    update: {},
    create: {
      id: 'default-template',
      name: 'Basic Makeup Course Certificate',
      description: 'Default template for makeup course certificates',
      design: {
        backgroundColor: '#ffffff',
        borderColor: '#d4af37',
        borderWidth: 5,
        logo: '/images/logo.png',
        font: 'Montserrat',
        titleColor: '#333333',
        textColor: '#555555',
        signaturePosition: 'bottom-right',
      },
      createdById: admin.id,
    },
  });
  console.log('Default template created:', template.id);

  // Create a sample certificate
  const certificate = await prisma.certificate.upsert({
    where: { certificateId: 'CERT-12345678' },
    update: {},
    create: {
      certificateId: 'CERT-12345678',
      recipientId: student.id,
      issuerId: staff.id,
      templateId: template.id,
      title: 'Basic Makeup Course Completion',
      issueDate: new Date(),
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2), // 2 years
      metadata: {
        grade: 'A+',
        duration: '120 hours',
        skills: ['Foundation', 'Contouring', 'Eye Makeup', 'Bridal Makeup'],
      },
      status: 'ACTIVE',
    },
  });
  console.log('Sample certificate created:', certificate.id);

  // Create audit logs
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityId: admin.id,
      entityType: 'USER',
      userId: admin.id,
      metadata: { role: 'ADMIN', email: admin.email },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityId: staff.id,
      entityType: 'USER',
      userId: admin.id,
      metadata: { role: 'STAFF', email: staff.email },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityId: student.id,
      entityType: 'USER',
      userId: admin.id,
      metadata: { role: 'STUDENT', email: student.email },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityId: template.id,
      entityType: 'TEMPLATE',
      userId: admin.id,
      metadata: { name: template.name },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityId: certificate.id,
      entityType: 'CERTIFICATE',
      userId: staff.id,
      metadata: {
        certificateId: certificate.certificateId,
        recipientId: student.id,
      },
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });