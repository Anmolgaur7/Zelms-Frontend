/**
 * Phase 3 catalog types — see docs/API_ENDPOINTS.md
 */

import type { PaginatedList } from '@/types/admin'

export type CatalogStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'CLOSED'

export interface Course {
  id: string
  name: string
  description?: string | null
  status?: CatalogStatus | string
  sopId?: string
  sop?: { id: string; title?: string; version?: string | null; status?: string } | null
  createdAt?: string
  updatedAt?: string
}

export interface CourseGroup {
  id: string
  name: string
  description?: string | null
  status?: CatalogStatus | string
  courses?: Course[]
  _count?: { courses?: number }
}

/** Backend may return a count or a list of skipped SOPs with reasons. */
export interface SkippedSopRef {
  sopId: string
  reason?: string
}

export interface CourseGroupAssignResult {
  created?: number
  skippedSops?: number | SkippedSopRef[]
  quizzesAssigned?: number
}

export type InductionStepType = 'COURSE' | 'ACKNOWLEDGMENT'

export interface InductionStep {
  id: string
  stepType: InductionStepType
  title: string
  sortOrder?: number
  courseId?: string | null
  course?: Course | null
  ackText?: string | null
}

export interface InductionProgram {
  id: string
  name: string
  description?: string | null
  status?: CatalogStatus | string
  steps?: InductionStep[]
}

export interface InductionEnrollmentProgress {
  stepId: string
  status?: string
  assignment?: { id: string; status?: string } | null
}

export interface InductionMyEnrollment {
  id: string
  programId: string
  program?: InductionProgram
  status?: string
  progress?: InductionEnrollmentProgress[]
}

export interface TrainingPlanItem {
  id: string
  label: string
  courseId?: string | null
  sopId?: string | null
  departmentId?: string | null
  plannedMonth?: number | null
  notes?: string | null
}

export interface TrainingPlanReview {
  id: string
  reviewType: 'MONTHLY' | 'ANNUAL' | string
  periodKey: string
  commentary: string
  createdAt?: string
}

export interface TrainingPlan {
  id: string
  calendarYear: number
  title: string
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | string
  items?: TrainingPlanItem[]
  reviews?: TrainingPlanReview[]
}

export interface JobDescription {
  id: string
  code: string
  title: string
  description?: string | null
  courses?: { courseId: string; course?: Course }[]
  userLinks?: { userId: string; user?: { id: string; name: string; employeeId?: string } }[]
}

export type QualificationStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | string

export interface QualificationStep {
  id: string
  /** API may send `stepRole` or `role`. */
  stepRole?: 'HOD' | 'HEAD_QA' | string
  role?: 'HOD' | 'HEAD_QA' | string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  decidedAt?: string | null
  sortOrder?: number
}

export interface Qualification {
  id: string
  subjectUserId: string
  qualificationType: 'EMPLOYEE' | 'TRAINER' | string
  status: QualificationStatus
  subject?: { id: string; name: string; employeeId?: string }
  steps?: QualificationStep[]
  createdAt?: string
}

export type CourseList = PaginatedList<Course> | Course[]
export type CourseGroupList = PaginatedList<CourseGroup> | CourseGroup[]
export type InductionProgramList = PaginatedList<InductionProgram> | InductionProgram[]
export type TrainingPlanList = PaginatedList<TrainingPlan> | TrainingPlan[]
export type JobDescriptionList = PaginatedList<JobDescription> | JobDescription[]
export type QualificationList = PaginatedList<Qualification> | Qualification[]
