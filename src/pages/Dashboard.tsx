import WelcomeSection from '../components/dashboard/WelcomeSection';
import ProjectOverviewCards from '../components/dashboard/ProjectOverviewCards';
import TaskSummarySection from '../components/dashboard/TaskSummarySection';
import ActivityFeedPanel from '../components/dashboard/ActivityFeedPanel';
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel';
import StandupReportPanel from '../components/dashboard/StandupReportPanel';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines';

const Dashboard = () => (
  <div className="dashboard-page">
    <WelcomeSection />

    <div className="dashboard-grid dashboard-grid-split">
      <TaskSummarySection />
      <QuickActionsPanel />
    </div>

    <StandupReportPanel />

    <ProjectOverviewCards />

    <div className="dashboard-grid dashboard-grid-split">
      <ActivityFeedPanel />
      <UpcomingDeadlines />
    </div>
  </div>
);

export default Dashboard;
