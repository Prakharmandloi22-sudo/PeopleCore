import { Router, Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../../config';
import { authenticateJwt } from '../../middleware/auth.middleware';
import { authorizeRoles } from '../../middleware/rbac.middleware';
import { DocumentCategory, DocumentAccessLevel, Role } from '@prisma/client';
import { StorageService } from '../../services/storage.service';
import { createAuditRecord } from '../../middleware/audit.middleware';

const router = Router();
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max limit
  storage: multer.memoryStorage(),
});

/**
 * POST /api/v1/documents/upload - Secure Document Upload (Assessment 08)
 */
router.post(
  '/upload',
  authenticateJwt,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'File is required.' } });
      return;
    }

    const { employeeId, title, category, accessLevel } = req.body;
    if (!employeeId || !title) {
      res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'employeeId and title are required.' } });
      return;
    }

    // Secure document storage with hash calculation and virus scan simulation
    const stored = await StorageService.storeFile(
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
    );

    const doc = await prisma.document.create({
      data: {
        employeeId,
        title,
        category: (category as DocumentCategory) || DocumentCategory.ID_PROOF,
        accessLevel: (accessLevel as DocumentAccessLevel) || DocumentAccessLevel.CONFIDENTIAL,
        fileUrl: stored.fileUrl,
        fileKey: stored.fileKey,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        checksum: stored.checksum,
        uploadedBy: req.user!.id,
        isVirusScanned: stored.isVirusScanned,
      }
    });

    await createAuditRecord({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'DOCUMENT_UPLOAD',
      entityName: 'Document',
      entityId: doc.id,
      newValues: { title: doc.title, checksum: doc.checksum, category: doc.category },
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, data: { document: doc } });
  }
);

/**
 * GET /api/v1/documents/employee/:employeeId - List documents for employee
 */
router.get(
  '/employee/:employeeId',
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    const isOwner = req.user?.employeeId && req.user.employeeId === req.params.employeeId;
    const isPrivileged = req.user?.role === Role.ADMINISTRATOR || req.user?.role === Role.HR_OFFICER;

    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const documents = await prisma.document.findMany({
      where: { employeeId: req.params.employeeId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { documents } });
  }
);

export default router;
