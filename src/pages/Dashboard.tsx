import WelcomeSection from '../components/dashboard/WelcomeSection';
import ProjectOverviewCards from '../components/dashboard/ProjectOverviewCards';
import TaskSummarySection from '../components/dashboard/TaskSummarySection';
import KanbanPreview from '../components/dashboard/KanbanPreview';
import AIInsightsPanel from '../components/dashboard/AIInsightsPanel';
import ActivityFeedPanel from '../components/dashboard/ActivityFeedPanel';
import TeamMembersPanel from '../components/dashboard/TeamMembersPanel';
import CalendarDeadlines from '../components/dashboard/CalendarDeadlines';
import QuickActionsPanel from '../components/dashboard/QuickActionsPanel';
import SnippetPreview from '../components/dashboard/SnippetPreview';
import DocsPreview from '../components/dashboard/DocsPreview';
import AnalyticsSection from '../components/dashboard/AnalyticsSection';

const Dashboard = () => (
  <div>
    <WelcomeSection />

    <div className="grid-columns-2">
      <TaskSummarySection />
      <QuickActionsPanel />
    </div>

    <ProjectOverviewCards />

    <div className="grid-columns-2">
      <KanbanPreview />
      <AIInsightsPanel />
    </div>

    <div className="grid-columns-2">
      <ActivityFeedPanel />
      <TeamMembersPanel />
    </div>

    <div className="grid-columns-2">
      <CalendarDeadlines />
      <AnalyticsSection />
    </div>

    <div className="grid-columns-2">
      <SnippetPreview />
      <DocsPreview />
    </div>
  </div>
);

export default Dashboard;
