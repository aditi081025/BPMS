import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  date,
  timestamp,
  pgEnum,
  index,
  check,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "BIM_DIRECTOR",
  "BIM_COORDINATOR",
  "BIM_SPECIALIST",
  "EDITOR",
  "VIEWER",
]);

export const primaryDisciplineEnum = pgEnum("primary_discipline", [
  "BIM - ACS",
  "Structure",
  "MEP - HVAC",
  "MEP - Electrical",
  "MEP - Plumbing",
  "Fire Protection",
  "Façade / Envelope",
  "Coordination & QA",
  "AI & Automation",
]);

export const availabilityStatusEnum = pgEnum("availability_status", [
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
]);

export const accessRequestStatusEnum = pgEnum("access_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export const feedbackSentimentEnum = pgEnum("feedback_sentiment", [
  "Positive / Commendation",
  "Neutral / Note",
  "Critical / Action Required",
]);

// 1. users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phoneNumber: varchar("phone_number", { length: 20 }),
    role: userRoleEnum("role").default("EDITOR").notNull(),
    primaryDiscipline: primaryDisciplineEnum("primary_discipline")
      .default("BIM - ACS")
      .notNull(),
    weeklyCapacityHrs: integer("weekly_capacity_hrs").default(40).notNull(),
    availabilityStatus: availabilityStatusEnum("availability_status")
      .default("ACTIVE")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
  ]
);

// 2. access_requests Table
export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
    discipline: varchar("discipline", { length: 100 })
      .default("BIM - ACS")
      .notNull(),
    reasonForAccess: text("reason_for_access").notNull(),
    requestedRole: varchar("requested_role", { length: 50 })
      .default("Editor")
      .notNull(),
    status: accessRequestStatusEnum("status").default("PENDING").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_access_requests_email").on(table.applicantEmail),
    index("idx_access_requests_status").on(table.status),
  ]
);

// 3. projects Table
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectCode: varchar("project_code", { length: 50 }).notNull().unique(),
    projectName: varchar("project_name", { length: 200 }).notNull(),
    status: projectStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_projects_code").on(table.projectCode),
    index("idx_projects_status").on(table.status),
  ]
);

// 4. project_assignments Table
export const projectAssignments = pgTable(
  "project_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedHours: numeric("assigned_hours", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    loggedHours: numeric("logged_hours", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_proj_assignments_project").on(table.projectId),
    index("idx_proj_assignments_user").on(table.userId),
  ]
);

// 5. hour_logs Table
export const hourLogs = pgTable(
  "hour_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedHours: numeric("assigned_hours", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    loggedHours: numeric("logged_hours", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    workDate: date("work_date"),
    taskDescription: text("task_description"),
    discipline: varchar("discipline", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_hour_logs_project").on(table.projectId),
    index("idx_hour_logs_user").on(table.userId),
  ]
);

// 6. project_feedback Table
export const projectFeedback = pgTable(
  "project_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    starRating: numeric("star_rating", { precision: 2, scale: 1 }).notNull(),
    feedbackCategory: varchar("feedback_category", { length: 100 }).notNull(),
    sentiment: feedbackSentimentEnum("sentiment").notNull(),
    authorName: varchar("author_name", { length: 150 }).notNull(),
    authorRole: varchar("author_role", { length: 100 }).notNull(),
    comments: text("comments").notNull(),
    actionItems: text("action_items"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_feedback_project").on(table.projectId),
    check(
      "check_star_rating_range",
      sql`${table.starRating} >= 1.0 AND ${table.starRating} <= 5.0`
    ),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(projectAssignments),
  hourLogs: many(hourLogs),
  accessRequests: many(accessRequests, { relationName: "userRequests" }),
  reviewedRequests: many(accessRequests, { relationName: "reviewedRequests" }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  assignments: many(projectAssignments),
  hourLogs: many(hourLogs),
  feedback: many(projectFeedback),
}));

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  user: one(users, {
    fields: [accessRequests.userId],
    references: [users.id],
    relationName: "userRequests",
  }),
  reviewer: one(users, {
    fields: [accessRequests.reviewedBy],
    references: [users.id],
    relationName: "reviewedRequests",
  }),
}));

export const projectAssignmentsRelations = relations(
  projectAssignments,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectAssignments.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectAssignments.userId],
      references: [users.id],
    }),
  })
);

export const hourLogsRelations = relations(hourLogs, ({ one }) => ({
  project: one(projects, {
    fields: [hourLogs.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [hourLogs.userId],
    references: [users.id],
  }),
}));

export const projectFeedbackRelations = relations(projectFeedback, ({ one }) => ({
  project: one(projects, {
    fields: [projectFeedback.projectId],
    references: [projects.id],
  }),
}));
