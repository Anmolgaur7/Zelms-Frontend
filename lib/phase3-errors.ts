/** User-facing copy for Phase 3 catalog error codes */

export function formatCatalogError(message: string, errorCode?: string): string {
  if (errorCode === 'ROUTE_NOT_FOUND') {
    return message
  }
  const map: Record<string, string> = {
    COURSE_DUPLICATE_NAME: 'A course with this name already exists.',
    COURSE_GROUP_DUPLICATE_NAME: 'A course group with this name already exists.',
    COURSE_GROUP_EMPTY: 'Add at least one course to the group before assigning.',
    COURSE_GROUP_MEMBER_EXISTS: 'That course is already in this group.',
    INDUCTION_ALREADY_ENROLLED: 'This user is already enrolled in the program.',
    TRAINING_PLAN_REVIEW_DUPLICATE: 'A review for this period already exists.',
    JD_DUPLICATE_CODE: 'A job description with this code already exists.',
    QUALIFICATION_STEP_OUT_OF_ORDER: 'Complete the previous approval step first.',
    QUALIFICATION_APPROVER_FORBIDDEN: 'Your role cannot approve this step.',
    QUALIFICATION_ALREADY_PENDING: 'A qualification request is already pending for this user.',
  }
  if (errorCode && map[errorCode]) return map[errorCode]
  return message
}
