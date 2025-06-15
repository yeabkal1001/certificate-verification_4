import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { PrismaClient } from '@prisma/client';
import handler from '../../pages/api/certificates';
import bulkHandler from '../../pages/api/certificates/bulk';

// Mock authentication
jest.mock('../../lib/auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      role: 'ADMIN'
    }
  }),
  verifyToken: jest.fn().mockReturnValue(true)
}));

// Mock Redis client
jest.mock('../../lib/redis', () => ({
  getClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }),
}));

// Mock metrics
jest.mock('../../lib/metrics', () => ({
  certificateCounter: {
    inc: jest.fn(),
  },
  certificateGenerationDuration: {
    startTimer: jest.fn().mockReturnValue(jest.fn()),
  },
}));

// Initialize Prisma client
const prisma = new PrismaClient();

describe('Certificate Generation API - Edge Cases', () => {
  // Setup test data
  beforeAll(async () => {
    // Clean up existing test templates
    await prisma.template.deleteMany({
      where: {
        id: {
          in: ['template-test-001', 'template-test-002']
        }
      }
    });

    // Create test templates
    await prisma.template.createMany({
      data: [
        {
          id: 'template-test-001',
          name: 'Test Template 1',
          html: '<div>{{recipientName}} - {{courseTitle}}</div>',
          createdById: 'admin-user-id',
          isActive: true,
        },
        {
          id: 'template-test-002',
          name: 'Test Template 2',
          html: '<div>Complex template with many fields: {{recipientName}}, {{courseTitle}}, {{issueDate}}, {{additionalFields.grade}}, {{additionalFields.credits}}</div>',
          createdById: 'admin-user-id',
          isActive: true,
        }
      ]
    });
  });

  // Clean up test data
  afterAll(async () => {
    // Delete test certificates
    await prisma.certificate.deleteMany({
      where: {
        recipientEmail: {
          contains: 'test-edge-case'
        }
      }
    });

    // Delete test templates
    await prisma.template.deleteMany({
      where: {
        id: {
          in: ['template-test-001', 'template-test-002']
        }
      }
    });

    await prisma.$disconnect();
  });

  it('should handle certificate with minimum required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        recipientName: 'Minimal User',
        recipientEmail: 'test-edge-case-minimal@example.com',
        issueDate: new Date().toISOString(),
        templateId: 'template-test-001',
        courseTitle: 'Minimal Course'
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.id).toBeDefined();
    expect(data.certificateUrl).toBeDefined();
  });

  it('should handle certificate with all possible fields and complex data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        recipientName: 'Complex User with a Very Long Name',
        recipientEmail: 'test-edge-case-complex@example.com',
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        templateId: 'template-test-002',
        courseTitle: 'Advanced Course with Special Characters: & < > " \' é ñ',
        additionalFields: {
          grade: 'A+',
          credits: 5,
          instructor: 'Dr. Professor',
          department: 'Computer Science',
          universityName: 'Test University',
          completionDate: new Date().toISOString(),
          achievements: ['Top Student', 'Perfect Attendance', 'Project Excellence'],
          specialMention: 'Graduated with honors',
          longDescription: 'A'.repeat(2000), // Very long text field
        }
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.id).toBeDefined();
    expect(data.certificateUrl).toBeDefined();
  });

  it('should reject certificate with invalid template ID', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        recipientName: 'Invalid Template User',
        recipientEmail: 'test-edge-case-invalid@example.com',
        issueDate: new Date().toISOString(),
        templateId: 'non-existent-template',
        courseTitle: 'Test Course'
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBeDefined();
  });

  it('should handle bulk certificate generation with valid data', async () => {
    const certificates = [];
    for (let i = 0; i < 5; i++) {
      certificates.push({
        recipientName: `Bulk User ${i}`,
        recipientEmail: `test-edge-case-bulk-${i}@example.com`,
        issueDate: new Date().toISOString(),
        templateId: 'template-test-001',
        courseTitle: 'Bulk Test Course'
      });
    }

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        certificates
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await bulkHandler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.count).toBe(5);
    expect(data.certificateIds).toHaveLength(5);
  });

  it('should handle bulk certificate generation with some invalid data', async () => {
    const certificates = [
      {
        recipientName: 'Valid Bulk User 1',
        recipientEmail: 'test-edge-case-mixed-1@example.com',
        issueDate: new Date().toISOString(),
        templateId: 'template-test-001',
        courseTitle: 'Mixed Test Course'
      },
      {
        // Missing required fields
        recipientName: 'Invalid Bulk User',
        templateId: 'template-test-001'
      },
      {
        recipientName: 'Valid Bulk User 2',
        recipientEmail: 'test-edge-case-mixed-2@example.com',
        issueDate: new Date().toISOString(),
        templateId: 'template-test-001',
        courseTitle: 'Mixed Test Course'
      }
    ];

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        certificates
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await bulkHandler(req, res);

    expect(res._getStatusCode()).toBe(207);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(data.certificateIds).toHaveLength(2);
    expect(data.errors).toHaveLength(1);
  });

  it('should handle extremely large bulk requests', async () => {
    const certificates = [];
    for (let i = 0; i < 100; i++) {
      certificates.push({
        recipientName: `Large Bulk User ${i}`,
        recipientEmail: `test-edge-case-large-${i}@example.com`,
        issueDate: new Date().toISOString(),
        templateId: 'template-test-001',
        courseTitle: 'Large Bulk Test Course'
      });
    }

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        certificates
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await bulkHandler(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.count).toBe(100);
    expect(data.certificateIds).toHaveLength(100);
  });

  it('should reject unauthorized certificate generation attempts', async () => {
    // Mock the auth module to return null session
    jest.requireMock('../../lib/auth').getServerSession.mockResolvedValueOnce(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        recipientName: 'Unauthorized User',
        recipientEmail: 'test-edge-case-unauthorized@example.com',
        issueDate: new Date().toISOString(),
        templateId: 'template-test-001',
        courseTitle: 'Unauthorized Course'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data.error).toBeDefined();
  });
});