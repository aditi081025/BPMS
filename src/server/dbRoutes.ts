import { Router, Request, Response } from 'express';
import { db, isSqlConfigured } from '../db/index.ts';
import {
  users,
  accessRequests,
  projects,
  projectAssignments,
  hourLogs,
  projectFeedback,
} from '../db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';

export const dbRouter = Router();

// ============================================================================
// SUPER ADMIN WHITELIST
// ============================================================================
export const SUPER_ADMIN_WHITELIST = [
  'modelatech2026@gmail.com',
  'sushoovandas@gmail.com',
  'aditichakraborty2005@gmail.com',
];

// ============================================================================
// RESILIENT IN-MEMORY DATA STORES (Active when SQL is offline or not configured)
// ============================================================================
const memoryUsers = new Map<string, any>([
  [
    'emp-2',
    {
      id: 'emp-2',
      fullName: 'Sushovan Das',
      email: 'sushovan.das@bimworkspace.com',
      phoneNumber: '+1 (555) 345-6789',
      role: 'COORDINATOR',
      primaryDiscipline: 'Coordination & QA',
      weeklyCapacityHrs: 40,
      availabilityStatus: 'ACTIVE',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    },
  ],
  [
    'emp-aditi',
    {
      id: 'emp-aditi',
      fullName: 'Aditi',
      email: 'aditi@bimworkspace.com',
      phoneNumber: '+1 (555) 456-7890',
      role: 'EDITOR',
      primaryDiscipline: 'BIM - ACS',
      weeklyCapacityHrs: 40,
      availabilityStatus: 'ACTIVE',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    },
  ],
  [
    'usr_super_admin_modelatech',
    {
      id: 'usr_super_admin_modelatech',
      fullName: 'Modela Tech',
      email: 'modelatech2026@gmail.com',
      phoneNumber: '+1 (555) 019-2834',
      role: 'SUPER_ADMIN',
      primaryDiscipline: 'BIM - ACS',
      weeklyCapacityHrs: 40,
      availabilityStatus: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'usr_super_admin_sushoovan',
    {
      id: 'usr_super_admin_sushoovan',
      fullName: 'sushoovan Das',
      email: 'sushoovandas@gmail.com',
      phoneNumber: '+1 (555) 019-2835',
      role: 'SUPER_ADMIN',
      primaryDiscipline: 'BIM - ACS',
      weeklyCapacityHrs: 40,
      availabilityStatus: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  [
    'usr_super_admin_aditi',
    {
      id: 'usr_super_admin_aditi',
      fullName: 'Aditi Chakraborty',
      email: 'aditichakraborty2005@gmail.com',
      phoneNumber: '+1 (555) 019-2836',
      role: 'SUPER_ADMIN',
      primaryDiscipline: 'BIM - ACS',
      weeklyCapacityHrs: 40,
      availabilityStatus: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
]);

const memoryProjects = new Map<string, any>([
  [
    'proj-1',
    {
      id: 'proj-1',
      projectCode: 'BIM-LWG',
      projectName: 'London Wall Gym',
      status: 'WIP',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    },
  ],
  [
    'proj-2',
    {
      id: 'proj-2',
      projectCode: 'BIM-STX',
      projectName: 'St. Jude Medical Research Hub',
      status: 'On Track',
      createdAt: '2026-02-15T08:00:00.000Z',
      updatedAt: '2026-02-15T08:00:00.000Z',
    },
  ],
  [
    'proj-3',
    {
      id: 'proj-3',
      projectCode: 'BIM-C34',
      projectName: 'Canary Wharf Tower 34',
      status: 'At Risk',
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    },
  ],
  [
    'proj-4',
    {
      id: 'proj-4',
      projectCode: 'BIM-KCX',
      projectName: "King's Cross Rail Interchange",
      status: 'WIP',
      createdAt: '2026-02-20T08:00:00.000Z',
      updatedAt: '2026-02-20T08:00:00.000Z',
    },
  ],
  [
    'proj-5',
    {
      id: 'proj-5',
      projectCode: 'BIM-ODT',
      projectName: 'Oxford Drug Target Genomics Wing',
      status: 'On Track',
      createdAt: '2026-01-25T08:00:00.000Z',
      updatedAt: '2026-01-25T08:00:00.000Z',
    },
  ],
]);

const memoryAccessRequests = new Map<string, any>();
const memoryAssignments = new Map<string, any>();
const memoryHourLogs = new Map<string, any>();
const memoryFeedback = new Map<string, any>();

// ============================================================================
// 1. USERS ENDPOINTS
// ============================================================================

// GET /api/users - List all users
dbRouter.get('/users', async (_req: Request, res: Response) => {
  if (isSqlConfigured && db) {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      return res.json({ success: true, data: allUsers });
    } catch (error: any) {
      console.warn('SQL users query notice (using memory):', error?.message);
    }
  }

  const userList = Array.from(memoryUsers.values());
  res.json({ success: true, data: userList });
});

// GET /api/users/:identifier - Get user by ID or Email
dbRouter.get('/users/:identifier', async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const isEmail = identifier.includes('@');
  const cleanId = identifier.toLowerCase().trim();

  if (isSqlConfigured && db) {
    try {
      const condition = isEmail ? eq(users.email, cleanId) : eq(users.id, identifier);
      const result = await db.select().from(users).where(condition).limit(1);
      if (result.length > 0) {
        return res.json({ success: true, data: result[0] });
      }
    } catch (error: any) {
      console.warn('SQL user lookup notice (using memory):', error?.message);
    }
  }

  // Memory lookup
  for (const u of memoryUsers.values()) {
    if (isEmail && u.email.toLowerCase() === cleanId) {
      return res.json({ success: true, data: u });
    }
    if (!isEmail && u.id === identifier) {
      return res.json({ success: true, data: u });
    }
  }

  res.status(404).json({ success: false, error: 'User not found' });
});

// POST /api/users - Create new user
dbRouter.post('/users', async (req: Request, res: Response) => {
  const {
    fullName,
    email,
    phoneNumber,
    role = 'EDITOR',
    primaryDiscipline = 'BIM - ACS',
    weeklyCapacityHrs = 40,
    availabilityStatus = 'ACTIVE',
  } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ success: false, error: 'fullName and email are required' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(fullName).trim();

  const userRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fullName: cleanName,
    email: cleanEmail,
    phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
    role: role as any,
    primaryDiscipline: primaryDiscipline as any,
    weeklyCapacityHrs: Number(weeklyCapacityHrs) || 40,
    availabilityStatus: availabilityStatus as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Find existing by email in memory
  let targetId = userRecord.id;
  for (const [id, u] of memoryUsers.entries()) {
    if (u.email.toLowerCase() === cleanEmail) {
      targetId = id;
      userRecord.id = id;
      break;
    }
  }
  memoryUsers.set(targetId, userRecord);

  if (isSqlConfigured && db) {
    try {
      const inserted = await db
        .insert(users)
        .values({
          fullName: cleanName,
          email: cleanEmail,
          phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
          role: role as any,
          primaryDiscipline: primaryDiscipline as any,
          weeklyCapacityHrs: Number(weeklyCapacityHrs) || 40,
          availabilityStatus: availabilityStatus as any,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            fullName: cleanName,
            role: role as any,
            primaryDiscipline: primaryDiscipline as any,
            weeklyCapacityHrs: Number(weeklyCapacityHrs) || 40,
            availabilityStatus: availabilityStatus as any,
            updatedAt: new Date(),
          },
        })
        .returning();
      return res.status(201).json({ success: true, data: inserted[0] });
    } catch (error: any) {
      console.warn('SQL user insert notice (using memory):', error?.message);
    }
  }

  res.status(201).json({ success: true, data: userRecord });
});

// PUT /api/users/:id - Update user details
dbRouter.put('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    fullName,
    phoneNumber,
    role,
    primaryDiscipline,
    weeklyCapacityHrs,
    availabilityStatus,
  } = req.body;

  const existing = memoryUsers.get(id);
  if (!existing && !isSqlConfigured) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const updatedRecord = {
    ...existing,
    ...(fullName !== undefined ? { fullName: String(fullName).trim() } : {}),
    ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber ? String(phoneNumber).trim() : null } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(primaryDiscipline !== undefined ? { primaryDiscipline } : {}),
    ...(weeklyCapacityHrs !== undefined ? { weeklyCapacityHrs: Number(weeklyCapacityHrs) } : {}),
    ...(availabilityStatus !== undefined ? { availabilityStatus } : {}),
    updatedAt: new Date().toISOString(),
  };
  memoryUsers.set(id, updatedRecord);

  if (isSqlConfigured && db) {
    try {
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (fullName !== undefined) updates.fullName = String(fullName).trim();
      if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber ? String(phoneNumber).trim() : null;
      if (role !== undefined) updates.role = role;
      if (primaryDiscipline !== undefined) updates.primaryDiscipline = primaryDiscipline;
      if (weeklyCapacityHrs !== undefined) updates.weeklyCapacityHrs = Number(weeklyCapacityHrs);
      if (availabilityStatus !== undefined) updates.availabilityStatus = availabilityStatus;

      const updated = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();

      if (updated.length > 0) {
        return res.json({ success: true, data: updated[0] });
      }
    } catch (error: any) {
      console.warn('SQL user update notice:', error?.message);
    }
  }

  res.json({ success: true, data: updatedRecord });
});

// DELETE /api/users/:id - Delete user
dbRouter.delete('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = memoryUsers.get(id);
  memoryUsers.delete(id);

  if (isSqlConfigured && db) {
    try {
      const dbDeleted = await db.delete(users).where(eq(users.id, id)).returning();
      if (dbDeleted.length > 0) {
        return res.json({
          success: true,
          message: 'User purged successfully',
          data: dbDeleted[0],
        });
      }
    } catch (error: any) {
      console.warn('SQL delete notice:', error?.message);
    }
  }

  res.json({
    success: true,
    message: 'User purged successfully',
    data: deleted || { id },
  });
});

// ============================================================================
// 2. ACCESS REQUESTS ENDPOINTS (Sign-in & Gating Queue)
// ============================================================================

// GET /api/access-requests - List all access requests
dbRouter.get('/access-requests', async (_req: Request, res: Response) => {
  if (isSqlConfigured && db) {
    try {
      const list = await db
        .select()
        .from(accessRequests)
        .orderBy(desc(accessRequests.submittedAt));
      return res.json({ success: true, data: list });
    } catch (error: any) {
      console.warn('SQL access-requests query notice (using memory):', error?.message);
    }
  }

  const list = Array.from(memoryAccessRequests.values());
  res.json({ success: true, data: list });
});

// GET /api/access-requests/check - Check existing request by normalized email
dbRouter.get('/access-requests/check', async (req: Request, res: Response) => {
  const emailQuery = req.query.email;
  if (!emailQuery || typeof emailQuery !== 'string') {
    return res.status(400).json({ success: false, error: 'email query parameter is required' });
  }
  const cleanEmail = emailQuery.trim().toLowerCase();
  const isSuperAdmin = SUPER_ADMIN_WHITELIST.includes(cleanEmail);

  if (isSuperAdmin) {
    return res.json({
      success: true,
      exists: true,
      isSuperAdmin: true,
      status: 'APPROVED',
      role: 'SUPER_ADMIN',
    });
  }

  if (isSqlConfigured && db) {
    try {
      const existingReq = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.applicantEmail, cleanEmail))
        .limit(1);

      if (existingReq.length > 0) {
        return res.json({
          success: true,
          exists: true,
          isSuperAdmin,
          status: existingReq[0].status,
          role: existingReq[0].requestedRole,
          data: existingReq[0],
        });
      }
    } catch (dbErr: any) {
      console.warn('SQL check access request notice:', dbErr?.message);
    }
  }

  const memReq = memoryAccessRequests.get(cleanEmail);
  if (memReq) {
    return res.json({
      success: true,
      exists: true,
      isSuperAdmin,
      status: memReq.status,
      role: memReq.requestedRole,
      data: memReq,
    });
  }

  res.json({
    success: true,
    exists: false,
    isSuperAdmin: false,
    status: 'NONE',
    role: 'NONE',
  });
});

// POST /api/verify-super-admin - Server-authoritative Super Admin check
dbRouter.post('/verify-super-admin', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'email is required' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const isSuperAdmin = SUPER_ADMIN_WHITELIST.includes(cleanEmail);

  if (!isSuperAdmin) {
    return res.status(403).json({
      success: false,
      isSuperAdmin: false,
      error: 'Forbidden: Email is not authorized for Super Admin privileges.',
    });
  }

  res.json({
    success: true,
    isSuperAdmin: true,
    role: 'SUPER_ADMIN',
    status: 'APPROVED',
    email: cleanEmail,
  });
});

// POST /api/access-requests - Submit access request with duplicate check & auto-approval of Super Admins
dbRouter.post('/access-requests', async (req: Request, res: Response) => {
  const {
    fullName,
    applicantEmail,
    discipline = 'BIM - ACS',
    reasonForAccess = 'Sign-in Access Request for ProductionPulse BPMS',
    requestedRole,
  } = req.body;

  if (!fullName || !applicantEmail) {
    return res.status(400).json({
      success: false,
      error: 'fullName and applicantEmail are required',
    });
  }

  const cleanEmail = String(applicantEmail).trim().toLowerCase();
  const cleanName = String(fullName).trim();
  const cleanReason = String(reasonForAccess || 'Sign-in Access Request for ProductionPulse BPMS').trim();
  const isSuperAdmin = SUPER_ADMIN_WHITELIST.includes(cleanEmail);

  // 1. Check for existing request to prevent duplicates
  let existingReq: any = null;
  if (isSqlConfigured && db) {
    try {
      const q = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.applicantEmail, cleanEmail))
        .limit(1);
      if (q.length > 0) existingReq = q[0];
    } catch {
      existingReq = memoryAccessRequests.get(cleanEmail);
    }
  } else {
    existingReq = memoryAccessRequests.get(cleanEmail);
  }

  if (existingReq) {
    if (isSuperAdmin && existingReq.status !== 'APPROVED') {
      existingReq.status = 'APPROVED';
      existingReq.requestedRole = 'SUPER_ADMIN';
      memoryAccessRequests.set(cleanEmail, existingReq);
      if (isSqlConfigured && db) {
        try {
          await db
            .update(accessRequests)
            .set({ status: 'APPROVED', requestedRole: 'SUPER_ADMIN', updatedAt: new Date() })
            .where(eq(accessRequests.id, existingReq.id));
        } catch {
          // ignore
        }
      }
      return res.json({
        success: true,
        isExisting: true,
        isSuperAdmin: true,
        status: 'APPROVED',
        role: 'SUPER_ADMIN',
        data: existingReq,
      });
    }

    return res.json({
      success: true,
      isExisting: true,
      isSuperAdmin,
      status: existingReq.status,
      role: isSuperAdmin ? 'SUPER_ADMIN' : existingReq.requestedRole,
      data: existingReq,
    });
  }

  // 2. Roles & Status enforcement:
  const finalStatus = isSuperAdmin ? 'APPROVED' : 'PENDING';
  const finalRole = isSuperAdmin ? 'SUPER_ADMIN' : 'USER';

  const newRecord = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fullName: cleanName,
    applicantEmail: cleanEmail,
    discipline: String(discipline).trim(),
    reasonForAccess: cleanReason,
    requestedRole: finalRole,
    status: finalStatus,
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryAccessRequests.set(cleanEmail, newRecord);

  if (isSqlConfigured && db) {
    try {
      const inserted = await db
        .insert(accessRequests)
        .values({
          fullName: cleanName,
          applicantEmail: cleanEmail,
          discipline: String(discipline).trim(),
          reasonForAccess: cleanReason,
          requestedRole: finalRole,
          status: finalStatus as any,
        })
        .returning();

      return res.status(201).json({
        success: true,
        isExisting: false,
        isSuperAdmin,
        status: finalStatus,
        role: finalRole,
        data: inserted[0],
      });
    } catch (err: any) {
      console.warn('SQL access-request insert notice (using memory):', err?.message);
    }
  }

  res.status(201).json({
    success: true,
    isExisting: false,
    isSuperAdmin,
    status: finalStatus,
    role: finalRole,
    data: newRecord,
  });
});

// PUT /api/access-requests/:id - Review / Update access request
dbRouter.put('/access-requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reviewedBy, requestedRole, discipline } = req.body;

  let matched: any = null;
  for (const [key, item] of memoryAccessRequests.entries()) {
    if (item.id === id) {
      item.status = status !== undefined ? status : item.status;
      item.reviewedBy = reviewedBy !== undefined ? reviewedBy : item.reviewedBy;
      item.requestedRole = requestedRole !== undefined ? requestedRole : item.requestedRole;
      item.discipline = discipline !== undefined ? discipline : item.discipline;
      item.updatedAt = new Date().toISOString();
      memoryAccessRequests.set(key, item);
      matched = item;
      break;
    }
  }

  if (isSqlConfigured && db) {
    try {
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (status !== undefined) updates.status = status;
      if (reviewedBy !== undefined) updates.reviewedBy = reviewedBy;
      if (requestedRole !== undefined) updates.requestedRole = requestedRole;
      if (discipline !== undefined) updates.discipline = discipline;

      const updated = await db
        .update(accessRequests)
        .set(updates)
        .where(eq(accessRequests.id, id))
        .returning();

      if (updated.length > 0) {
        return res.json({ success: true, data: updated[0] });
      }
    } catch (err: any) {
      console.warn('SQL access request update notice:', err?.message);
    }
  }

  if (matched) {
    return res.json({ success: true, data: matched });
  }

  res.status(404).json({ success: false, error: 'Access request not found' });
});

// DELETE /api/access-requests/:id - Delete access request
dbRouter.delete('/access-requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  let deleted: any = null;
  for (const [key, item] of memoryAccessRequests.entries()) {
    if (item.id === id) {
      deleted = item;
      memoryAccessRequests.delete(key);
      break;
    }
  }

  if (isSqlConfigured && db) {
    try {
      const dbDel = await db.delete(accessRequests).where(eq(accessRequests.id, id)).returning();
      if (dbDel.length > 0) {
        return res.json({ success: true, data: dbDel[0] });
      }
    } catch (err: any) {
      console.warn('SQL access request delete notice:', err?.message);
    }
  }

  res.json({ success: true, data: deleted || { id } });
});

// ============================================================================
// 3. PROJECTS ENDPOINTS
// ============================================================================

// GET /api/projects - List all projects
dbRouter.get('/projects', async (_req: Request, res: Response) => {
  if (isSqlConfigured && db) {
    try {
      const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
      return res.json({ success: true, data: allProjects });
    } catch (error: any) {
      console.warn('SQL projects query notice (using memory):', error?.message);
    }
  }

  const projectList = Array.from(memoryProjects.values());
  res.json({ success: true, data: projectList });
});

// POST /api/projects - Create project
dbRouter.post('/projects', async (req: Request, res: Response) => {
  const { projectCode, projectName, status = 'ACTIVE' } = req.body;
  if (!projectCode || !projectName) {
    return res.status(400).json({ success: false, error: 'projectCode and projectName are required' });
  }

  const newProj = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectCode: String(projectCode).trim(),
    projectName: String(projectName).trim(),
    status: status as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryProjects.set(newProj.id, newProj);

  if (isSqlConfigured && db) {
    try {
      const inserted = await db
        .insert(projects)
        .values({
          projectCode: String(projectCode).trim(),
          projectName: String(projectName).trim(),
          status: status as any,
        })
        .returning();
      return res.status(201).json({ success: true, data: inserted[0] });
    } catch (err: any) {
      console.warn('SQL project insert notice (using memory):', err?.message);
    }
  }

  res.status(201).json({ success: true, data: newProj });
});

// PUT /api/projects/:id - Update project
dbRouter.put('/projects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { projectCode, projectName, status } = req.body;

  const existing = memoryProjects.get(id);
  const updatedProj = {
    ...existing,
    ...(projectCode !== undefined ? { projectCode: String(projectCode).trim() } : {}),
    ...(projectName !== undefined ? { projectName: String(projectName).trim() } : {}),
    ...(status !== undefined ? { status } : {}),
    updatedAt: new Date().toISOString(),
  };
  memoryProjects.set(id, updatedProj);

  if (isSqlConfigured && db) {
    try {
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (projectCode !== undefined) updates.projectCode = String(projectCode).trim();
      if (projectName !== undefined) updates.projectName = String(projectName).trim();
      if (status !== undefined) updates.status = status;

      const updated = await db
        .update(projects)
        .set(updates)
        .where(eq(projects.id, id))
        .returning();

      if (updated.length > 0) {
        return res.json({ success: true, data: updated[0] });
      }
    } catch (err: any) {
      console.warn('SQL project update notice:', err?.message);
    }
  }

  res.json({ success: true, data: updatedProj });
});

// DELETE /api/projects/:id - Delete project
dbRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = memoryProjects.get(id);
  memoryProjects.delete(id);

  if (isSqlConfigured && db) {
    try {
      const dbDel = await db.delete(projects).where(eq(projects.id, id)).returning();
      if (dbDel.length > 0) {
        return res.json({ success: true, message: 'Project purged', data: dbDel[0] });
      }
    } catch (err: any) {
      console.warn('SQL project delete notice:', err?.message);
    }
  }

  res.json({ success: true, message: 'Project purged', data: deleted || { id } });
});

// ============================================================================
// 4. PROJECT ASSIGNMENTS & HOUR LOGS ENDPOINTS
// ============================================================================

// GET /api/project-assignments - List assignments
dbRouter.get('/project-assignments', async (req: Request, res: Response) => {
  const { projectId, userId } = req.query;

  if (isSqlConfigured && db) {
    try {
      let q = db.select().from(projectAssignments);
      if (projectId) {
        q = q.where(eq(projectAssignments.projectId, String(projectId))) as any;
      } else if (userId) {
        q = q.where(eq(projectAssignments.userId, String(userId))) as any;
      }
      const assignments = await q.orderBy(desc(projectAssignments.createdAt));
      return res.json({ success: true, data: assignments });
    } catch (err: any) {
      console.warn('SQL assignments query notice:', err?.message);
    }
  }

  let list = Array.from(memoryAssignments.values());
  if (projectId) {
    list = list.filter((a) => a.projectId === String(projectId));
  } else if (userId) {
    list = list.filter((a) => a.userId === String(userId));
  }

  res.json({ success: true, data: list });
});

// POST /api/project-assignments - Assign hours / create assignment
dbRouter.post('/project-assignments', async (req: Request, res: Response) => {
  const { projectId, userId, assignedHours = 0, loggedHours = 0, startDate, dueDate } = req.body;
  if (!projectId || !userId) {
    return res.status(400).json({ success: false, error: 'projectId and userId are required' });
  }

  const newAssignment = {
    id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId,
    userId,
    assignedHours: String(assignedHours),
    loggedHours: String(loggedHours),
    startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
    dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryAssignments.set(newAssignment.id, newAssignment);

  if (isSqlConfigured && db) {
    try {
      const inserted = await db
        .insert(projectAssignments)
        .values({
          projectId,
          userId,
          assignedHours: String(assignedHours),
          loggedHours: String(loggedHours),
          startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
          dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
        })
        .returning();
      return res.status(201).json({ success: true, data: inserted[0] });
    } catch (err: any) {
      console.warn('SQL assignment insert notice:', err?.message);
    }
  }

  res.status(201).json({ success: true, data: newAssignment });
});

// PUT /api/project-assignments/:id - Update assignment
dbRouter.put('/project-assignments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedHours, loggedHours, startDate, dueDate } = req.body;

  const existing = memoryAssignments.get(id);
  const updated = {
    ...existing,
    ...(assignedHours !== undefined ? { assignedHours: String(assignedHours) } : {}),
    ...(loggedHours !== undefined ? { loggedHours: String(loggedHours) } : {}),
    ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null } : {}),
    ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null } : {}),
    updatedAt: new Date().toISOString(),
  };
  memoryAssignments.set(id, updated);

  if (isSqlConfigured && db) {
    try {
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (assignedHours !== undefined) updates.assignedHours = String(assignedHours);
      if (loggedHours !== undefined) updates.loggedHours = String(loggedHours);
      if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
      if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate).toISOString().split('T')[0] : null;

      const dbUp = await db
        .update(projectAssignments)
        .set(updates)
        .where(eq(projectAssignments.id, id))
        .returning();
      if (dbUp.length > 0) return res.json({ success: true, data: dbUp[0] });
    } catch (err: any) {
      console.warn('SQL assignment update notice:', err?.message);
    }
  }

  res.json({ success: true, data: updated });
});

// DELETE /api/project-assignments/:id - Delete assignment
dbRouter.delete('/project-assignments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = memoryAssignments.get(id);
  memoryAssignments.delete(id);

  if (isSqlConfigured && db) {
    try {
      const dbDel = await db.delete(projectAssignments).where(eq(projectAssignments.id, id)).returning();
      if (dbDel.length > 0) return res.json({ success: true, data: dbDel[0] });
    } catch (err: any) {
      console.warn('SQL assignment delete notice:', err?.message);
    }
  }

  res.json({ success: true, data: deleted || { id } });
});

// GET /api/hour-logs - List logged hours
dbRouter.get('/hour-logs', async (req: Request, res: Response) => {
  const { projectId, userId } = req.query;

  if (isSqlConfigured && db) {
    try {
      let q = db.select().from(hourLogs);
      if (projectId) {
        q = q.where(eq(hourLogs.projectId, String(projectId))) as any;
      } else if (userId) {
        q = q.where(eq(hourLogs.userId, String(userId))) as any;
      }
      const logs = await q.orderBy(desc(hourLogs.createdAt));
      return res.json({ success: true, data: logs });
    } catch (err: any) {
      console.warn('SQL hour-logs query notice:', err?.message);
    }
  }

  let list = Array.from(memoryHourLogs.values());
  if (projectId) list = list.filter((l) => l.projectId === String(projectId));
  if (userId) list = list.filter((l) => l.userId === String(userId));
  res.json({ success: true, data: list });
});

// POST /api/hour-logs - Log hours
dbRouter.post('/hour-logs', async (req: Request, res: Response) => {
  const {
    projectId,
    userId,
    loggedHours,
    assignedHours = 0,
    workDate,
    taskDescription,
    discipline,
  } = req.body;

  if (!projectId || !userId || loggedHours === undefined) {
    return res.status(400).json({ success: false, error: 'projectId, userId, and loggedHours are required' });
  }

  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId,
    userId,
    loggedHours: String(loggedHours),
    assignedHours: String(assignedHours),
    workDate: workDate ? new Date(workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    taskDescription: taskDescription ? String(taskDescription).trim() : null,
    discipline: discipline ? String(discipline).trim() : null,
    createdAt: new Date().toISOString(),
  };
  memoryHourLogs.set(newLog.id, newLog);

  if (isSqlConfigured && db) {
    try {
      const inserted = await db
        .insert(hourLogs)
        .values({
          projectId,
          userId,
          loggedHours: String(loggedHours),
          assignedHours: String(assignedHours),
          workDate: workDate ? new Date(workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          taskDescription: taskDescription ? String(taskDescription).trim() : null,
          discipline: discipline ? String(discipline).trim() : null,
        })
        .returning();

      return res.status(201).json({ success: true, data: inserted[0] });
    } catch (err: any) {
      console.warn('SQL log hours notice:', err?.message);
    }
  }

  res.status(201).json({ success: true, data: newLog });
});

// DELETE /api/hour-logs/:id - Delete hour log
dbRouter.delete('/hour-logs/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = memoryHourLogs.get(id);
  memoryHourLogs.delete(id);

  if (isSqlConfigured && db) {
    try {
      const dbDel = await db.delete(hourLogs).where(eq(hourLogs.id, id)).returning();
      if (dbDel.length > 0) return res.json({ success: true, data: dbDel[0] });
    } catch (err: any) {
      console.warn('SQL log delete notice:', err?.message);
    }
  }

  res.json({ success: true, data: deleted || { id } });
});

// ============================================================================
// 5. PROJECT FEEDBACK ENDPOINTS (Public Client Portal)
// ============================================================================

// GET /api/project-feedback - List all feedback
dbRouter.get('/project-feedback', async (req: Request, res: Response) => {
  const { projectId } = req.query;

  if (isSqlConfigured && db) {
    try {
      let q = db.select().from(projectFeedback);
      if (projectId) {
        q = q.where(eq(projectFeedback.projectId, String(projectId))) as any;
      }
      const items = await q.orderBy(desc(projectFeedback.createdAt));
      return res.json({ success: true, data: items });
    } catch (err: any) {
      console.warn('SQL feedback query notice:', err?.message);
    }
  }

  let list = Array.from(memoryFeedback.values());
  if (projectId) list = list.filter((f) => f.projectId === String(projectId));
  res.json({ success: true, data: list });
});

// POST /api/project-feedback - Submit client feedback
dbRouter.post('/project-feedback', async (req: Request, res: Response) => {
  const {
    projectId,
    starRating,
    feedbackCategory,
    sentiment,
    authorName,
    authorRole,
    comments,
    actionItems,
    tags = [],
  } = req.body;

  if (!projectId || starRating === undefined || !feedbackCategory || !sentiment || !authorName || !comments) {
    return res.status(400).json({
      success: false,
      error: 'projectId, starRating, feedbackCategory, sentiment, authorName, and comments are required',
    });
  }

  const ratingNum = Number(starRating);
  if (isNaN(ratingNum) || ratingNum < 1.0 || ratingNum > 5.0) {
    return res.status(400).json({ success: false, error: 'starRating must be between 1.0 and 5.0' });
  }

  const newFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId,
    starRating: ratingNum.toFixed(1),
    feedbackCategory: String(feedbackCategory).trim(),
    sentiment: sentiment as any,
    authorName: String(authorName).trim(),
    authorRole: String(authorRole || 'Client Stakeholder').trim(),
    comments: String(comments).trim(),
    actionItems: actionItems ? String(actionItems).trim() : null,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
  };
  memoryFeedback.set(newFeedback.id, newFeedback);

  if (isSqlConfigured && db) {
    try {
      const inserted = await db
        .insert(projectFeedback)
        .values({
          projectId,
          starRating: ratingNum.toFixed(1),
          feedbackCategory: String(feedbackCategory).trim(),
          sentiment: sentiment as any,
          authorName: String(authorName).trim(),
          authorRole: String(authorRole || 'Client Stakeholder').trim(),
          comments: String(comments).trim(),
          actionItems: actionItems ? String(actionItems).trim() : null,
          tags: Array.isArray(tags) ? tags : [],
        })
        .returning();

      return res.status(201).json({ success: true, data: inserted[0] });
    } catch (err: any) {
      console.warn('SQL feedback insert notice:', err?.message);
    }
  }

  res.status(201).json({ success: true, data: newFeedback });
});

// DELETE /api/project-feedback/:id - Delete feedback
dbRouter.delete('/project-feedback/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = memoryFeedback.get(id);
  memoryFeedback.delete(id);

  if (isSqlConfigured && db) {
    try {
      const dbDel = await db.delete(projectFeedback).where(eq(projectFeedback.id, id)).returning();
      if (dbDel.length > 0) return res.json({ success: true, data: dbDel[0] });
    } catch (err: any) {
      console.warn('SQL feedback delete notice:', err?.message);
    }
  }

  res.json({ success: true, data: deleted || { id } });
});
