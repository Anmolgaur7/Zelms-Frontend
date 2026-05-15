'use server'

/**
 * Phase 3 catalog APIs — courses, groups, induction, plans, JD, qualifications.
 * See docs/API_ENDPOINTS.md and docs/FRONTEND_IMPLEMENTATION_GUIDE.md §5
 */

import { api, ApiError } from '@/lib/api'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/auth'
import type {
  Course,
  CourseGroup,
  CourseGroupAssignResult,
  InductionProgram,
  InductionMyEnrollment,
  TrainingPlan,
  JobDescription,
  Qualification,
} from '@/types/phase3'

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    sp.set(k, String(v))
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

function unwrapList<T>(raw: unknown, key?: string): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    if (key && Array.isArray(o[key])) return o[key] as T[]
    if (Array.isArray(o.data)) return o.data as T[]
    if (Array.isArray(o.courses)) return o.courses as T[]
    if (Array.isArray(o.courseGroups)) return o.courseGroups as T[]
    if (Array.isArray(o.programs)) return o.programs as T[]
    if (Array.isArray(o.plans)) return o.plans as T[]
    if (Array.isArray(o.jobDescriptions)) return o.jobDescriptions as T[]
    if (Array.isArray(o.qualifications)) return o.qualifications as T[]
  }
  return []
}

function actionErr(e: unknown, fallback: string): ActionResult<never> {
  if (e instanceof ApiError) {
    return { error: e.message, errorCode: e.errorCode, requestId: e.requestId }
  }
  return { error: fallback }
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export async function getCourses(query?: {
  status?: string
  search?: string
  sopId?: string
}): Promise<Course[]> {
  const { courses } = await getCoursesWithMeta(query)
  return courses
}

/** Detect whether Phase 3 `GET /api/courses` exists on the connected API. */
export async function getCoursesWithMeta(query?: {
  status?: string
  search?: string
  sopId?: string
}): Promise<{ courses: Course[]; apiAvailable: boolean }> {
  const path = `/api/courses${buildQuery({
    status: query?.status,
    search: query?.search,
    sopId: query?.sopId,
  })}`
  try {
    const raw = await api.get<unknown>(path)
    if (raw == null) {
      return { courses: [], apiAvailable: false }
    }
    return { courses: unwrapList<Course>(raw, 'courses'), apiAvailable: true }
  } catch (e) {
    if (e instanceof ApiError && e.errorCode === 'ROUTE_NOT_FOUND') {
      return { courses: [], apiAvailable: false }
    }
    return { courses: [], apiAvailable: true }
  }
}

export async function getCourse(id: string): Promise<Course | null> {
  try {
    return await api.get<Course>(`/api/courses/${id}`)
  } catch {
    return null
  }
}

export async function createCourse(body: {
  name: string
  sopId: string
  description?: string
  reason: string
}): Promise<ActionResult<Course>> {
  try {
    const data = await api.post<Course>('/api/courses', body)
    revalidatePath('/dashboard/courses')
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to create course.')
  }
}

export async function updateCourse(
  id: string,
  body: {
    name?: string
    description?: string
    status?: string
    sopId?: string
    reason: string
  },
): Promise<ActionResult<Course>> {
  try {
    const data = await api.patch<Course>(`/api/courses/${id}`, body)
    revalidatePath('/dashboard/courses')
    revalidatePath(`/dashboard/courses/${id}`)
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to update course.')
  }
}

// ─── Course groups ───────────────────────────────────────────────────────────

export async function getCourseGroups(query?: {
  status?: string
  search?: string
}): Promise<CourseGroup[]> {
  const { groups } = await getCourseGroupsWithMeta(query)
  return groups
}

/** Detect whether Phase 3 `GET /api/course-groups` exists on the connected API. */
export async function getCourseGroupsWithMeta(query?: {
  status?: string
  search?: string
}): Promise<{ groups: CourseGroup[]; apiAvailable: boolean }> {
  const path = `/api/course-groups${buildQuery({
    status: query?.status,
    search: query?.search,
  })}`
  try {
    const raw = await api.get<unknown>(path)
    if (raw == null) {
      return { groups: [], apiAvailable: false }
    }
    return {
      groups: unwrapList<CourseGroup>(raw, 'courseGroups'),
      apiAvailable: true,
    }
  } catch (e) {
    if (e instanceof ApiError && e.errorCode === 'ROUTE_NOT_FOUND') {
      return { groups: [], apiAvailable: false }
    }
    return { groups: [], apiAvailable: true }
  }
}

export async function getCourseGroup(id: string): Promise<CourseGroup | null> {
  try {
    return await api.get<CourseGroup>(`/api/course-groups/${id}`)
  } catch {
    return null
  }
}

export async function createCourseGroup(body: {
  name: string
  description?: string
  reason: string
}): Promise<ActionResult<CourseGroup>> {
  try {
    const data = await api.post<CourseGroup>('/api/course-groups', body)
    revalidatePath('/dashboard/course-groups')
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to create course group.')
  }
}

export async function addCourseToGroup(
  groupId: string,
  body: { courseId: string; sortOrder?: number; reason: string },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(`/api/course-groups/${groupId}/courses`, body)
    revalidatePath('/dashboard/course-groups')
    revalidatePath(`/dashboard/course-groups/${groupId}`)
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Failed to add course to group.')
  }
}

export async function assignCourseGroupDepartment(
  groupId: string,
  body: { departmentId: string; deadline?: string; reason: string },
): Promise<ActionResult<CourseGroupAssignResult>> {
  try {
    const data = await api.post<CourseGroupAssignResult>(
      `/api/course-groups/${groupId}/assign-department`,
      body,
    )
    revalidatePath('/dashboard/assignments')
    return { data }
  } catch (e) {
    return actionErr(e, 'Department assignment failed.')
  }
}

// ─── Induction ───────────────────────────────────────────────────────────────

export async function getInductionPrograms(query?: {
  status?: string
}): Promise<InductionProgram[]> {
  const { programs } = await getInductionProgramsWithMeta(query)
  return programs
}

export async function getInductionProgramsWithMeta(query?: {
  status?: string
}): Promise<{ programs: InductionProgram[]; apiAvailable: boolean }> {
  const path = `/api/induction-programs${buildQuery({ status: query?.status })}`
  try {
    const raw = await api.get<unknown>(path)
    if (raw == null) {
      return { programs: [], apiAvailable: false }
    }
    return {
      programs: unwrapList<InductionProgram>(raw, 'programs'),
      apiAvailable: true,
    }
  } catch (e) {
    if (e instanceof ApiError && e.errorCode === 'ROUTE_NOT_FOUND') {
      return { programs: [], apiAvailable: false }
    }
    return { programs: [], apiAvailable: true }
  }
}

export async function getInductionProgram(id: string): Promise<InductionProgram | null> {
  try {
    return await api.get<InductionProgram>(`/api/induction-programs/${id}`)
  } catch {
    return null
  }
}

export async function createInductionProgram(body: {
  name: string
  description?: string
  reason: string
}): Promise<ActionResult<InductionProgram>> {
  try {
    const data = await api.post<InductionProgram>('/api/induction-programs', body)
    revalidatePath('/dashboard/induction')
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to create induction program.')
  }
}

export async function addInductionStep(
  programId: string,
  body:
    | { stepType: 'COURSE'; title: string; courseId: string; reason: string }
    | { stepType: 'ACKNOWLEDGMENT'; title: string; ackText: string; reason: string },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(`/api/induction-programs/${programId}/steps`, body)
    revalidatePath(`/dashboard/induction/${programId}`)
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Failed to add step.')
  }
}

export async function enrollUserInduction(
  programId: string,
  body: { userId: string; deadline?: string; reason: string },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(
      `/api/induction-programs/${programId}/enroll-user`,
      body,
    )
    revalidatePath('/dashboard/induction')
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Enrollment failed.')
  }
}

export async function getMyInductionEnrollments(): Promise<InductionMyEnrollment[]> {
  try {
    const raw = await api.get<unknown>('/api/induction-programs/my')
    return unwrapList<InductionMyEnrollment>(raw, 'enrollments')
  } catch {
    return []
  }
}

export async function acknowledgeInductionStep(
  enrollmentId: string,
  stepId: string,
  body: { reason: string; password: string },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(
      `/api/induction-enrollments/${enrollmentId}/steps/${stepId}/acknowledge`,
      body,
    )
    revalidatePath('/my-trainings/induction')
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Acknowledgment failed.')
  }
}

// ─── Training plans ──────────────────────────────────────────────────────────

export async function getTrainingPlans(query?: {
  year?: number
  status?: string
}): Promise<TrainingPlan[]> {
  const { plans } = await getTrainingPlansWithMeta(query)
  return plans
}

export async function getTrainingPlansWithMeta(query?: {
  year?: number
  status?: string
}): Promise<{ plans: TrainingPlan[]; apiAvailable: boolean }> {
  const path = `/api/training-plans${buildQuery({
    year: query?.year,
    status: query?.status,
  })}`
  try {
    const raw = await api.get<unknown>(path)
    if (raw == null) return { plans: [], apiAvailable: false }
    return { plans: unwrapList<TrainingPlan>(raw, 'plans'), apiAvailable: true }
  } catch (e) {
    if (e instanceof ApiError && e.errorCode === 'ROUTE_NOT_FOUND') {
      return { plans: [], apiAvailable: false }
    }
    return { plans: [], apiAvailable: true }
  }
}

export async function getTrainingPlan(id: string): Promise<TrainingPlan | null> {
  try {
    return await api.get<TrainingPlan>(`/api/training-plans/${id}`)
  } catch {
    return null
  }
}

export async function createTrainingPlan(body: {
  calendarYear: number
  title: string
  reason: string
}): Promise<ActionResult<TrainingPlan>> {
  try {
    const data = await api.post<TrainingPlan>('/api/training-plans', body)
    revalidatePath('/dashboard/training-plans')
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to create training plan.')
  }
}

export async function addTrainingPlanItem(
  planId: string,
  body: {
    label: string
    courseId?: string
    sopId?: string
    departmentId?: string
    plannedMonth?: number
    notes?: string
    reason: string
  },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(`/api/training-plans/${planId}/items`, body)
    revalidatePath(`/dashboard/training-plans/${planId}`)
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Failed to add plan item.')
  }
}

// ─── Job descriptions ────────────────────────────────────────────────────────

export async function getJobDescriptions(): Promise<JobDescription[]> {
  const { items } = await getJobDescriptionsWithMeta()
  return items
}

export async function getJobDescriptionsWithMeta(): Promise<{
  items: JobDescription[]
  apiAvailable: boolean
}> {
  try {
    const raw = await api.get<unknown>('/api/job-descriptions')
    if (raw == null) return { items: [], apiAvailable: false }
    return {
      items: unwrapList<JobDescription>(raw, 'jobDescriptions'),
      apiAvailable: true,
    }
  } catch (e) {
    if (e instanceof ApiError && e.errorCode === 'ROUTE_NOT_FOUND') {
      return { items: [], apiAvailable: false }
    }
    return { items: [], apiAvailable: true }
  }
}

export async function getJobDescription(id: string): Promise<JobDescription | null> {
  try {
    return await api.get<JobDescription>(`/api/job-descriptions/${id}`)
  } catch {
    return null
  }
}

export async function createJobDescription(body: {
  code: string
  title: string
  description?: string
  reason: string
}): Promise<ActionResult<JobDescription>> {
  try {
    const data = await api.post<JobDescription>('/api/job-descriptions', body)
    revalidatePath('/dashboard/job-descriptions')
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to create job description.')
  }
}

export async function linkCourseToJobDescription(
  jdId: string,
  body: { courseId: string; reason: string },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(`/api/job-descriptions/${jdId}/courses`, body)
    revalidatePath(`/dashboard/job-descriptions/${jdId}`)
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Failed to link course.')
  }
}

export async function assignUserToJobDescription(
  jdId: string,
  body: { userId: string; reason: string },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(`/api/job-descriptions/${jdId}/assign-user`, body)
    revalidatePath(`/dashboard/job-descriptions/${jdId}`)
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Failed to assign user to job description.')
  }
}

// ─── Qualifications ──────────────────────────────────────────────────────────

export async function getQualifications(query?: {
  status?: string
}): Promise<Qualification[]> {
  const { items } = await getQualificationsWithMeta(query)
  return items
}

export async function getQualificationsWithMeta(query?: {
  status?: string
}): Promise<{ items: Qualification[]; apiAvailable: boolean }> {
  const path = `/api/qualifications${buildQuery({ status: query?.status })}`
  try {
    const raw = await api.get<unknown>(path)
    if (raw == null) return { items: [], apiAvailable: false }
    return {
      items: unwrapList<Qualification>(raw, 'qualifications'),
      apiAvailable: true,
    }
  } catch (e) {
    if (e instanceof ApiError && e.errorCode === 'ROUTE_NOT_FOUND') {
      return { items: [], apiAvailable: false }
    }
    return { items: [], apiAvailable: true }
  }
}

export async function getQualification(id: string): Promise<Qualification | null> {
  try {
    return await api.get<Qualification>(`/api/qualifications/${id}`)
  } catch {
    return null
  }
}

export async function getMyQualifications(): Promise<Qualification[]> {
  try {
    const raw = await api.get<unknown>('/api/qualifications/my')
    return unwrapList<Qualification>(raw, 'qualifications')
  } catch {
    return []
  }
}

export async function createQualification(body: {
  subjectUserId: string
  qualificationType: 'EMPLOYEE' | 'TRAINER'
  reason: string
}): Promise<ActionResult<Qualification>> {
  try {
    const data = await api.post<Qualification>('/api/qualifications', body)
    revalidatePath('/dashboard/qualifications')
    return { data }
  } catch (e) {
    return actionErr(e, 'Failed to create qualification request.')
  }
}

export async function decideQualificationStep(
  qualificationId: string,
  stepId: string,
  body: {
    decision: 'APPROVE' | 'REJECT'
    reason: string
    password: string
  },
): Promise<ActionResult<unknown>> {
  try {
    const data = await api.post(
      `/api/qualifications/${qualificationId}/steps/${stepId}/decide`,
      body,
    )
    revalidatePath('/dashboard/qualifications')
    revalidatePath(`/dashboard/qualifications/${qualificationId}`)
    return { data: data as unknown }
  } catch (e) {
    return actionErr(e, 'Decision failed.')
  }
}
