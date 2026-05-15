/**
 * Plain-language copy for the training catalog — helps admins understand
 * how SOPs, courses, groups, induction, plans, JDs, and qualifications relate.
 */

export type CatalogGuideId =
  | 'training-setup'
  | 'sops'
  | 'assignments'
  | 'courses'
  | 'course-groups'
  | 'induction'
  | 'training-plans'
  | 'job-descriptions'
  | 'qualifications'
  | 'users'
  | 'departments'
  | 'audit'
  | 'compliance'
  | 'risk'
  | 'sop-difficulty'
  | 'company'

export type WorkflowStep = {
  step: number
  id: CatalogGuideId
  title: string
  /** Shown on small screens in the horizontal flow strip. */
  compactLabel: string
  short: string
  href: string
}

/** Recommended order for setting up training content. */
export const TRAINING_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    id: 'sops',
    title: 'SOPs',
    compactLabel: 'SOPs',
    short: 'Publish procedure documents',
    href: '/dashboard/sops',
  },
  {
    step: 2,
    id: 'courses',
    title: 'Courses',
    compactLabel: 'Courses',
    short: 'Link each SOP to a training course',
    href: '/dashboard/courses',
  },
  {
    step: 3,
    id: 'assignments',
    title: 'Assignments',
    compactLabel: 'Assign',
    short: 'Send training to people (or use groups below)',
    href: '/dashboard/assignments',
  },
  {
    step: 4,
    id: 'course-groups',
    title: 'Course groups',
    compactLabel: 'Groups',
    short: 'Bundle courses & assign a whole department',
    href: '/dashboard/course-groups',
  },
  {
    step: 5,
    id: 'induction',
    title: 'Induction',
    compactLabel: 'Induction',
    short: 'Onboarding path with steps + enrollments',
    href: '/dashboard/induction',
  },
  {
    step: 6,
    id: 'training-plans',
    title: 'Training plans',
    compactLabel: 'Plans',
    short: 'Yearly planner with monthly line items',
    href: '/dashboard/training-plans',
  },
  {
    step: 7,
    id: 'job-descriptions',
    title: 'Job descriptions',
    compactLabel: 'Roles',
    short: 'Role matrix: required courses per job',
    href: '/dashboard/job-descriptions',
  },
  {
    step: 8,
    id: 'qualifications',
    title: 'Qualifications',
    compactLabel: 'Approval',
    short: 'HOD → Head QA approval for a person',
    href: '/dashboard/qualifications',
  },
]

export type PageGuide = {
  title: string
  tagline: string
  /** One sentence a new admin should read first. */
  summary: string
  /** What this area is NOT — reduces confusion. */
  notTheSameAs?: string
  /** Bullets for the expandable help panel. */
  howToUse: string[]
  nextSteps: { label: string; href: string; description?: string }[]
  workflowStep?: number
}

export const PAGE_GUIDES: Record<CatalogGuideId, PageGuide> = {
  'training-setup': {
    title: 'Your training roadmap',
    tagline: 'Your friendly map through training',
    summary:
      'Documents (SOPs) become courses. You assign training directly, or bundle courses into groups, induction programs, yearly plans, and job roles.',
    howToUse: [
      'Start with published SOPs, then create courses that point to them.',
      'Use Assignments for one-off training, or Course groups to train a whole department at once.',
      'Induction is for new-hire onboarding paths; Training plans are for annual scheduling.',
      'Job descriptions define which courses a role needs; Qualifications are formal sign-off ladders.',
    ],
    nextSteps: [
      { label: 'Go to SOPs', href: '/dashboard/sops', description: 'Step 1' },
      { label: 'Create a course', href: '/dashboard/courses', description: 'Step 2' },
    ],
  },
  sops: {
    title: 'Standard Operating Procedures (SOPs)',
    tagline: 'Source documents for all training',
    summary:
      'Standard Operating Procedures are the master content. A course always points to one SOP; assignments use quizzes tied to that SOP.',
    notTheSameAs: 'Creating an SOP does not assign training or create a course automatically.',
    howToUse: [
      'Upload and publish SOPs to ACTIVE before assigning or linking courses.',
      'Add quizzes to SOPs so assignments have something for learners to complete.',
    ],
    nextSteps: [
      { label: 'Create courses', href: '/dashboard/courses' },
      { label: 'Assign training', href: '/dashboard/assignments' },
    ],
    workflowStep: 1,
  },
  assignments: {
    title: 'Assignments',
    tagline: 'Who must complete which training',
    summary:
      'Assignments connect people to SOP quizzes with due dates. This is the direct way to push training—no course group required.',
    notTheSameAs:
      'Assignments are not the same as Courses, Course groups, or Induction programs.',
    howToUse: [
      'Pick an ACTIVE SOP (with a quiz), choose a user or bulk-assign a department.',
      'Learners see tasks under My Trainings.',
    ],
    nextSteps: [
      { label: 'Course groups (bulk by bundle)', href: '/dashboard/course-groups' },
      { label: 'View compliance', href: '/dashboard/analytics/compliance' },
    ],
    workflowStep: 3,
  },
  courses: {
    title: 'Courses',
    tagline: 'Training catalog entries',
    summary:
      'Each course is one training item linked to one SOP. Courses are building blocks—you reuse them in groups, induction, plans, and job descriptions.',
    notTheSameAs:
      'A course does not appear in Course groups, Induction, or Job descriptions until you add it there.',
    howToUse: [
      'Create a course after the linked SOP is ACTIVE.',
      'Then add it to a course group, induction step, plan line item, or JD.',
    ],
    nextSteps: [
      { label: 'Bundle in course groups', href: '/dashboard/course-groups' },
      { label: 'Use in induction', href: '/dashboard/induction' },
    ],
    workflowStep: 2,
  },
  'course-groups': {
    title: 'Course groups',
    tagline: 'Bundles assigned to a department',
    summary:
      'Group related courses together, then assign the whole bundle to a department. The system creates assignments (first quiz per SOP).',
    notTheSameAs: 'Not the same as creating a single Course or an Induction program.',
    howToUse: [
      'Create a group → add courses from your catalog → Assign to department.',
      'Check the result summary for created vs skipped assignments.',
    ],
    nextSteps: [
      { label: 'Manage courses', href: '/dashboard/courses' },
      { label: 'View assignments', href: '/dashboard/assignments' },
    ],
    workflowStep: 4,
  },
  induction: {
    title: 'Induction programs',
    tagline: 'Structured onboarding paths',
    summary:
      'Build a ordered checklist: course steps (training) and acknowledgment steps (e-sign). Enroll a learner to create their assignments.',
    notTheSameAs:
      'Not the same as a single Course or a Course group—induction is a multi-step program.',
    howToUse: [
      'Create program → add steps → enroll user.',
      'Learners complete the path under My induction.',
    ],
    nextSteps: [
      { label: 'Course catalog', href: '/dashboard/courses' },
      { label: 'Start here (roadmap)', href: '/dashboard/training-setup' },
    ],
    workflowStep: 5,
  },
  'training-plans': {
    title: 'Training plans',
    tagline: 'Yearly training calendar',
    summary:
      'Plan training across the year with line items (optional month, course, department). Status flows DRAFT → ACTIVE → CLOSED.',
    notTheSameAs: 'Not the same as Assignments or Course groups—this is planning, not auto-assign.',
    howToUse: [
      'Create a plan for a calendar year.',
      'Add line items; link courses when you know what will run each month.',
    ],
    nextSteps: [
      { label: 'Execute via assignments', href: '/dashboard/assignments' },
      { label: 'Courses', href: '/dashboard/courses' },
    ],
    workflowStep: 6,
  },
  'job-descriptions': {
    title: 'Job descriptions',
    tagline: 'Role ↔ required training matrix',
    summary:
      'Define a job code/title, link required courses, and assign people to that role so you know what training the role demands.',
    notTheSameAs: 'Not the same as Qualifications (approval ladder) or Courses alone.',
    howToUse: [
      'Create JD → link courses → assign employees to the JD.',
    ],
    nextSteps: [
      { label: 'Courses', href: '/dashboard/courses' },
      { label: 'Qualifications', href: '/dashboard/qualifications' },
    ],
    workflowStep: 7,
  },
  qualifications: {
    title: 'Qualifications',
    tagline: 'Formal approval: HOD then Head QA',
    summary:
      'Start a qualification request for an employee or trainer. Approvers e-sign each step in order until approved or rejected.',
    notTheSameAs:
      'Not training content—this is a compliance sign-off workflow for a person.',
    howToUse: [
      'New request → pick subject employee and type.',
      'Open the request to approve/reject pending steps with password (e-sign).',
    ],
    nextSteps: [
      { label: 'Users', href: '/dashboard/users' },
      { label: 'Start here (roadmap)', href: '/dashboard/training-setup' },
    ],
    workflowStep: 8,
  },
  users: {
    title: 'Users',
    tagline: 'People who can sign in and take training',
    summary:
      'Accounts carry roles (Admin, Trainer, Employee, …) and tie to an employee record. Assignments and departments always target these people.',
    notTheSameAs:
      'Adding a user does not automatically enroll them in induction or assign SOPs—you still assign training or use groups.',
    howToUse: [
      'Create users so people can log in and appear in assignment pickers.',
      'Use Bulk import when HR already has a spreadsheet of employees.',
      'Departments help filter who gets course-group assignments.',
    ],
    nextSteps: [
      { label: 'Departments', href: '/dashboard/departments' },
      { label: 'Assignments', href: '/dashboard/assignments' },
    ],
  },
  departments: {
    title: 'Departments',
    tagline: 'Organise people for bulk training',
    summary:
      'Departments group employees. Course groups can assign a whole bundle to everyone in a department at once.',
    notTheSameAs:
      'Departments are not training content—SOPs and courses still live in their own areas.',
    howToUse: [
      'Create departments that match how you run training (site, team, line, etc.).',
      'Assign each user to a department so bulk actions stay accurate.',
    ],
    nextSteps: [
      { label: 'Course groups', href: '/dashboard/course-groups' },
      { label: 'Users', href: '/dashboard/users' },
    ],
  },
  audit: {
    title: 'Audit log',
    tagline: 'Who changed what, with integrity checks',
    summary:
      'Every sensitive change in your tenant is recorded. Use the detail view to inspect payloads and verify the audit chain.',
    howToUse: [
      'Newest actions appear first; paginate to go further back.',
      'Open any row when you need evidence for auditors or internal review.',
    ],
    nextSteps: [
      { label: 'Compliance report', href: '/dashboard/analytics/compliance' },
      { label: 'Start here', href: '/dashboard/training-setup' },
    ],
  },
  compliance: {
    title: 'Compliance report',
    tagline: 'Are people finishing training on time?',
    summary:
      'Roll-up of assignments: completion rates by department and by SOP, plus overdue and failed counts.',
    notTheSameAs:
      'This is analytics, not the live assignment list—use Assignments for line-by-line changes.',
    howToUse: [
      'Scan KPIs first, then the department chart for weak pockets.',
      'Sort the SOP table by lowest compliance to prioritise follow-up.',
      'Use export when leadership wants a spreadsheet snapshot.',
    ],
    nextSteps: [
      { label: 'Assignments', href: '/dashboard/assignments' },
      { label: 'Risk report', href: '/dashboard/analytics/risk' },
    ],
  },
  risk: {
    title: 'Risk report',
    tagline: 'Who needs attention right now?',
    summary:
      'Surfaces trainees with overdue items, quiz failures, or lockouts—ranked so admins can unblock or reassign quickly.',
    howToUse: [
      'Start with Critical / High badges, then open the dossier from the row.',
      'Pair with Assignments when you need to extend due dates or unlock.',
    ],
    nextSteps: [
      { label: 'Assignments', href: '/dashboard/assignments' },
      { label: 'Compliance overview', href: '/dashboard/analytics/compliance' },
    ],
  },
  'sop-difficulty': {
    title: 'SOP quiz difficulty',
    tagline: 'Where are learners struggling?',
    summary:
      'Pass rates and scores per SOP help trainers decide which procedures need clearer content or refresher sessions.',
    notTheSameAs:
      'Low pass rate here does not change assignment status—you still manage that under Assignments.',
    howToUse: [
      'Focus on SOPs with many attempts but low passes first.',
      'Cross-check related assignments if one team is repeatedly failing.',
    ],
    nextSteps: [
      { label: 'SOP library', href: '/dashboard/sops' },
      { label: 'Compliance', href: '/dashboard/analytics/compliance' },
    ],
  },
  company: {
    title: 'Company settings',
    tagline: 'How your tenant looks on documents',
    summary:
      'Logo and read-only metadata from platform onboarding appear on login, dashboards, and PDF certificates.',
    howToUse: [
      'Upload a square or wide logo—the form shows how it will be used.',
      'Contact your platform admin if legal name or license fields need correcting.',
    ],
    nextSteps: [
      { label: 'Audit log', href: '/dashboard/audit' },
      { label: 'Start here', href: '/dashboard/training-setup' },
    ],
  },
}

export function getWorkflowStep(guideId: CatalogGuideId): WorkflowStep | undefined {
  return TRAINING_WORKFLOW_STEPS.find((s) => s.id === guideId)
}
