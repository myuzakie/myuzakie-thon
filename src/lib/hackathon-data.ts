export const tracker = {
  title: 'Hackathon Tracker 2026',
  url: 'https://docs.google.com/spreadsheets/d/1vjKrwmlUnaTpgtQl7hKddhAJhfMsV436xfklJ6_UxEw/edit',
  tabs: {
    events: 'Events_Master',
    tasks: 'Task_Tracker',
    ideas: 'Idea_Vault',
    resources: 'UI_Resources',
    submission: 'Submission_Checklist',
    dashboard: 'Operations_Dashboard'
  }
} as const

export type EventStatus = 'Not Started' | 'In Progress' | 'Submitted'

export const events = [
  {
    id: 'HACK-003',
    name: 'OpenCV AI Competition 2026 powered by AWS',
    organizer: 'OpenCV Foundation / AWS',
    deadline: '27 Oct 2026, 13:45',
    focus: 'Computer Vision / Agentic Vision',
    prize: '$20,250',
    priority: 'Unscored',
    status: 'Not Started' as EventStatus,
    verification: 'REVIEW - deadline conflict',
    url: 'https://opencv26.devpost.com/',
    driveFolder: 'https://drive.google.com/drive/folders/1P-6q8rXS7I1MmD805WbbES-Lv_gL4Uvs'
  },
  {
    id: 'HACK-002',
    name: 'Life After Code - GitLab Transcend',
    organizer: 'GitLab',
    deadline: '27 Oct 2026, 20:00',
    focus: 'DevSecOps / AI Agents',
    prize: '$45,000',
    priority: 'Unscored',
    status: 'Not Started' as EventStatus,
    verification: 'REVIEW - page cache conflict',
    url: 'https://gitlab-transcend.devpost.com/',
    driveFolder: 'https://drive.google.com/drive/folders/1M3syFKpM1qo5lNsfnvDLLvs88KSMUxs2'
  },
  {
    id: 'HACK-001',
    name: 'Nebius x NVIDIA Global AI Hackathon',
    organizer: 'Nebius / NVIDIA',
    deadline: '31 Oct 2026, 00:00',
    focus: 'AI Agents / LLM',
    prize: '$50,000',
    priority: 'Unscored',
    status: 'Not Started' as EventStatus,
    verification: 'Verified date; eligibility pending',
    url: 'https://nebiusglobalaihackathon.devpost.com/',
    driveFolder: 'https://drive.google.com/drive/folders/157yUMBrwIcMxfySMz6V9jV5djrxU5dvt'
  },
  {
    id: 'HACK-004',
    name: 'PayPal AI Hackathon',
    organizer: 'PayPal',
    deadline: '13 Nov 2026, 03:00',
    focus: 'Fintech / Agentic Commerce',
    prize: '$67,500',
    priority: 'Unscored',
    status: 'Not Started' as EventStatus,
    verification: 'Verified date; eligibility pending',
    url: 'https://paypalaihackathon.devpost.com/',
    driveFolder: 'https://drive.google.com/drive/folders/1TxrY5TvzwUR4cWjyWnMSyrWi0z1bTQpl'
  }
]

export const tasks = [
  { id: 'T-001', eventId: 'HACK-003', task: 'Check eligibility, registration, deadline conflict', workstream: 'Discovery', priority: 'P0', due: '19 Oct 2026', status: 'Backlog' },
  { id: 'T-002', eventId: 'HACK-002', task: 'Confirm October Life After Code event and registration', workstream: 'Discovery', priority: 'P0', due: '19 Oct 2026', status: 'Backlog' },
  { id: 'T-003', eventId: 'HACK-001', task: 'Check Nebius account and NVIDIA model access', workstream: 'Access', priority: 'P0', due: '19 Oct 2026', status: 'Backlog' },
  { id: 'T-005', eventId: 'ALL', task: 'Score 4 events; choose 1 primary + 1 backup', workstream: 'Strategy', priority: 'P0', due: '20 Oct 2026', status: 'Backlog' },
  { id: 'T-008', eventId: 'PRIMARY', task: 'Implement tested end-to-end happy path', workstream: 'Development', priority: 'P1', due: '25 Oct 2026', status: 'Backlog' }
]

export const ideas = [
  { id: 'IDEA-001', eventId: 'HACK-001', title: 'Autonomous Code Review and Repair Agent', problem: 'Review loops can be slow', target: 'Developers', status: 'Unvalidated', effort: 'Medium' },
  { id: 'IDEA-002', eventId: 'HACK-002', title: 'Self-Healing DevSecOps Pipeline', problem: 'Repetitive CI failures', target: 'DevOps teams', status: 'Unvalidated', effort: 'High' },
  { id: 'IDEA-003', eventId: 'HACK-003', title: 'Agentic Visual Safety Inspection', problem: 'Manual visual checks', target: 'Operations teams', status: 'Unvalidated', effort: 'Medium' },
  { id: 'IDEA-004', eventId: 'HACK-004', title: 'AI Commerce and Payment Copilot', problem: 'Payment workflow friction', target: 'SMBs / merchants', status: 'Unvalidated', effort: 'High' }
]

export const resources = [
  { id: 'UI-001', category: 'Design Inspiration', name: 'Figma Community', url: 'https://www.figma.com/community', useCase: 'Templates and UI patterns', status: 'To Explore' },
  { id: 'UI-002', category: 'UX Reference', name: 'Mobbin', url: 'https://mobbin.com/', useCase: 'Product flows and interaction patterns', status: 'To Explore' },
  { id: 'UI-003', category: 'UI Components', name: 'shadcn/ui', url: 'https://ui.shadcn.com/', useCase: 'Reusable React components', status: 'To Explore' },
  { id: 'UI-004', category: 'Icons', name: 'Lucide', url: 'https://lucide.dev/', useCase: 'Consistent icons', status: 'To Explore' }
]

export const submissionItems = [
  { id: 'SC-001', eventId: 'HACK-001', requirement: 'Runs on Nebius Token Factory or AI Cloud', category: 'Tech', status: 'Not Started' },
  { id: 'SC-002', eventId: 'HACK-001', requirement: 'Uses NVIDIA open-source model', category: 'Tech', status: 'Not Started' },
  { id: 'SC-003', eventId: 'HACK-001', requirement: 'Working project / demo URL', category: 'Demo', status: 'Not Started' },
  { id: 'SC-004', eventId: 'HACK-001', requirement: 'Public repository with open-source license', category: 'Repository', status: 'Not Started' },
  { id: 'SC-005', eventId: 'HACK-001', requirement: 'README and setup instructions', category: 'Docs', status: 'Not Started' },
  { id: 'SC-006', eventId: 'HACK-001', requirement: 'Public YouTube demo <=3 minutes', category: 'Submission', status: 'Not Started' },
  { id: 'SC-008', eventId: 'HACK-002', requirement: 'GitLab Duo Agent Platform flow or agent works', category: 'Tech', status: 'Not Started' },
  { id: 'SC-009', eventId: 'HACK-002', requirement: 'Public GitLab repo and MIT license', category: 'Repository', status: 'Not Started' }
]

export const dashboardMetrics = [
  { Metric: 'Active_Hackathons', Value: '2', Description: '1 primer · 1 cadangan' },
  { Metric: 'Active_Project', Value: '1', Description: 'Hackathon Command Center' },
  { Metric: 'Days_To_Next_Deadline', Value: '14', Description: 'Menuju akhir Oktober' },
  { Metric: 'Submission_Readiness', Value: '62%', Description: 'On track' }
]

export const project = {
  name: 'Hackathon Command Center',
  repository: 'https://github.com/myuzakie/myuzakie-thon',
  branch: 'feature/hackathon-workspace',
  progress: 72,
  milestones: [
    { label: 'Dashboard shell', status: 'Done' },
    { label: 'Workspace modules', status: 'In progress' },
    { label: 'Google Sheets sync', status: 'In progress' },
    { label: 'GitHub sync', status: 'Planned' }
  ]
}
