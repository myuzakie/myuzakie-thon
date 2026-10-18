import { OperationsCommandCenter, dashboardFallbackRows } from '@/components/hackathon/operations-command-center'

const DashboardPage = () => <OperationsCommandCenter initialEvents={dashboardFallbackRows.events} initialTasks={dashboardFallbackRows.tasks} initialSubmission={dashboardFallbackRows.submission} />

export default DashboardPage
