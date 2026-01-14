import Layout from "./Layout.jsx";

import AIEventPlanner from "./AIEventPlanner";

import AIPersonalization from "./AIPersonalization";

import Activities from "./Activities";

import AdvancedGamificationAnalytics from "./AdvancedGamificationAnalytics";

import Analytics from "./Analytics";

import AuditLog from "./AuditLog";

import Calendar from "./Calendar";

import Channels from "./Channels";

import ContentModerationAdmin from "./ContentModerationAdmin";

import Dashboard from "./Dashboard";

import Documentation from "./Documentation";

import EmployeeDirectory from "./EmployeeDirectory";

import EventTemplates from "./EventTemplates";

import EventWizard from "./EventWizard";

import ExampleModulePage from "./ExampleModulePage";

import FacilitatorDashboard from "./FacilitatorDashboard";

import FacilitatorView from "./FacilitatorView";

import Gamification from "./Gamification";

import GamificationAdmin from "./GamificationAdmin";

import GamificationAnalytics from "./GamificationAnalytics";

import GamificationDashboard from "./GamificationDashboard";

import GamificationRulesAdmin from "./GamificationRulesAdmin";

import GamificationSettings from "./GamificationSettings";

import Home from "./Home";

import Integrations from "./Integrations";

import IntegrationsHub from "./IntegrationsHub";

import KnowledgeHub from "./KnowledgeHub";

import Leaderboards from "./Leaderboards";

import LearningDashboard from "./LearningDashboard";

import LearningPath from "./LearningPath";

import Milestones from "./Milestones";

import NewEmployeeOnboarding from "./NewEmployeeOnboarding";

import OnboardingDashboard from "./OnboardingDashboard";

import OnboardingHub from "./OnboardingHub";

import ParticipantEvent from "./ParticipantEvent";

import ParticipantPortal from "./ParticipantPortal";

import PointStore from "./PointStore";

import ProfileCustomization from "./ProfileCustomization";

import ProjectPlan from "./ProjectPlan";

import PublicProfile from "./PublicProfile";

import RealTimeAnalytics from "./RealTimeAnalytics";

import Recognition from "./Recognition";

import RewardsAdmin from "./RewardsAdmin";

import RewardsStore from "./RewardsStore";

import RoleManagement from "./RoleManagement";

import RoleSelection from "./RoleSelection";

import RoleSetup from "./RoleSetup";

import Settings from "./Settings";

import SkillsDashboard from "./SkillsDashboard";

import SocialGamification from "./SocialGamification";

import SocialHub from "./SocialHub";

import Surveys from "./Surveys";

import TeamAutomation from "./TeamAutomation";

import TeamAutomations from "./TeamAutomations";

import TeamCompetition from "./TeamCompetition";

import TeamDashboard from "./TeamDashboard";

import TeamLeaderDashboard from "./TeamLeaderDashboard";

import TeamPerformanceDashboard from "./TeamPerformanceDashboard";

import Teams from "./Teams";

import UserProfile from "./UserProfile";

import UserRoleAssignment from "./UserRoleAssignment";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    AIEventPlanner: AIEventPlanner,
    
    AIPersonalization: AIPersonalization,
    
    Activities: Activities,
    
    AdvancedGamificationAnalytics: AdvancedGamificationAnalytics,
    
    Analytics: Analytics,
    
    AuditLog: AuditLog,
    
    Calendar: Calendar,
    
    Channels: Channels,
    
    ContentModerationAdmin: ContentModerationAdmin,
    
    Dashboard: Dashboard,
    
    Documentation: Documentation,
    
    EmployeeDirectory: EmployeeDirectory,
    
    EventTemplates: EventTemplates,
    
    EventWizard: EventWizard,
    
    ExampleModulePage: ExampleModulePage,
    
    FacilitatorDashboard: FacilitatorDashboard,
    
    FacilitatorView: FacilitatorView,
    
    Gamification: Gamification,
    
    GamificationAdmin: GamificationAdmin,
    
    GamificationAnalytics: GamificationAnalytics,
    
    GamificationDashboard: GamificationDashboard,
    
    GamificationRulesAdmin: GamificationRulesAdmin,
    
    GamificationSettings: GamificationSettings,
    
    Home: Home,
    
    Integrations: Integrations,
    
    IntegrationsHub: IntegrationsHub,
    
    KnowledgeHub: KnowledgeHub,
    
    Leaderboards: Leaderboards,
    
    LearningDashboard: LearningDashboard,
    
    LearningPath: LearningPath,
    
    Milestones: Milestones,
    
    NewEmployeeOnboarding: NewEmployeeOnboarding,
    
    OnboardingDashboard: OnboardingDashboard,
    
    OnboardingHub: OnboardingHub,
    
    ParticipantEvent: ParticipantEvent,
    
    ParticipantPortal: ParticipantPortal,
    
    PointStore: PointStore,
    
    ProfileCustomization: ProfileCustomization,
    
    ProjectPlan: ProjectPlan,
    
    PublicProfile: PublicProfile,
    
    RealTimeAnalytics: RealTimeAnalytics,
    
    Recognition: Recognition,
    
    RewardsAdmin: RewardsAdmin,
    
    RewardsStore: RewardsStore,
    
    RoleManagement: RoleManagement,
    
    RoleSelection: RoleSelection,
    
    RoleSetup: RoleSetup,
    
    Settings: Settings,
    
    SkillsDashboard: SkillsDashboard,
    
    SocialGamification: SocialGamification,
    
    SocialHub: SocialHub,
    
    Surveys: Surveys,
    
    TeamAutomation: TeamAutomation,
    
    TeamAutomations: TeamAutomations,
    
    TeamCompetition: TeamCompetition,
    
    TeamDashboard: TeamDashboard,
    
    TeamLeaderDashboard: TeamLeaderDashboard,
    
    TeamPerformanceDashboard: TeamPerformanceDashboard,
    
    Teams: Teams,
    
    UserProfile: UserProfile,
    
    UserRoleAssignment: UserRoleAssignment,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<AIEventPlanner />} />
                
                
                <Route path="/AIEventPlanner" element={<AIEventPlanner />} />
                
                <Route path="/AIPersonalization" element={<AIPersonalization />} />
                
                <Route path="/Activities" element={<Activities />} />
                
                <Route path="/AdvancedGamificationAnalytics" element={<AdvancedGamificationAnalytics />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/AuditLog" element={<AuditLog />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Channels" element={<Channels />} />
                
                <Route path="/ContentModerationAdmin" element={<ContentModerationAdmin />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Documentation" element={<Documentation />} />
                
                <Route path="/EmployeeDirectory" element={<EmployeeDirectory />} />
                
                <Route path="/EventTemplates" element={<EventTemplates />} />
                
                <Route path="/EventWizard" element={<EventWizard />} />
                
                <Route path="/ExampleModulePage" element={<ExampleModulePage />} />
                
                <Route path="/FacilitatorDashboard" element={<FacilitatorDashboard />} />
                
                <Route path="/FacilitatorView" element={<FacilitatorView />} />
                
                <Route path="/Gamification" element={<Gamification />} />
                
                <Route path="/GamificationAdmin" element={<GamificationAdmin />} />
                
                <Route path="/GamificationAnalytics" element={<GamificationAnalytics />} />
                
                <Route path="/GamificationDashboard" element={<GamificationDashboard />} />
                
                <Route path="/GamificationRulesAdmin" element={<GamificationRulesAdmin />} />
                
                <Route path="/GamificationSettings" element={<GamificationSettings />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Integrations" element={<Integrations />} />
                
                <Route path="/IntegrationsHub" element={<IntegrationsHub />} />
                
                <Route path="/KnowledgeHub" element={<KnowledgeHub />} />
                
                <Route path="/Leaderboards" element={<Leaderboards />} />
                
                <Route path="/LearningDashboard" element={<LearningDashboard />} />
                
                <Route path="/LearningPath" element={<LearningPath />} />
                
                <Route path="/Milestones" element={<Milestones />} />
                
                <Route path="/NewEmployeeOnboarding" element={<NewEmployeeOnboarding />} />
                
                <Route path="/OnboardingDashboard" element={<OnboardingDashboard />} />
                
                <Route path="/OnboardingHub" element={<OnboardingHub />} />
                
                <Route path="/ParticipantEvent" element={<ParticipantEvent />} />
                
                <Route path="/ParticipantPortal" element={<ParticipantPortal />} />
                
                <Route path="/PointStore" element={<PointStore />} />
                
                <Route path="/ProfileCustomization" element={<ProfileCustomization />} />
                
                <Route path="/ProjectPlan" element={<ProjectPlan />} />
                
                <Route path="/PublicProfile" element={<PublicProfile />} />
                
                <Route path="/RealTimeAnalytics" element={<RealTimeAnalytics />} />
                
                <Route path="/Recognition" element={<Recognition />} />
                
                <Route path="/RewardsAdmin" element={<RewardsAdmin />} />
                
                <Route path="/RewardsStore" element={<RewardsStore />} />
                
                <Route path="/RoleManagement" element={<RoleManagement />} />
                
                <Route path="/RoleSelection" element={<RoleSelection />} />
                
                <Route path="/RoleSetup" element={<RoleSetup />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/SkillsDashboard" element={<SkillsDashboard />} />
                
                <Route path="/SocialGamification" element={<SocialGamification />} />
                
                <Route path="/SocialHub" element={<SocialHub />} />
                
                <Route path="/Surveys" element={<Surveys />} />
                
                <Route path="/TeamAutomation" element={<TeamAutomation />} />
                
                <Route path="/TeamAutomations" element={<TeamAutomations />} />
                
                <Route path="/TeamCompetition" element={<TeamCompetition />} />
                
                <Route path="/TeamDashboard" element={<TeamDashboard />} />
                
                <Route path="/TeamLeaderDashboard" element={<TeamLeaderDashboard />} />
                
                <Route path="/TeamPerformanceDashboard" element={<TeamPerformanceDashboard />} />
                
                <Route path="/Teams" element={<Teams />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/UserRoleAssignment" element={<UserRoleAssignment />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}