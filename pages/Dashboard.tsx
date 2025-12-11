import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ViewType } from '../types';
import StudyLab from '../components/studylab/StudyLab';
import CreatorHub from '../components/creatorhub/CreatorHub';
import AutoFlowStudio from '../components/autoflow/AutoFlowStudio';
import LiveTutor from '../components/live/LiveTutor';
import ScriptToVideo from '../components/media/ScriptToVideo';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<ViewType>(ViewType.STUDY_LAB);
  
  // Lifted state for notes to share between StudyLab and CreatorHub
  const [notes, setNotes] = useState('');

  const handleTransform = () => {
    setActiveTab(ViewType.CREATOR_HUB);
  };

  const renderContent = () => {
    switch (activeTab) {
      case ViewType.STUDY_LAB:
        return (
          <StudyLab 
            notes={notes} 
            setNotes={setNotes} 
            onTransform={handleTransform} 
          />
        );
      case ViewType.CREATOR_HUB:
        return (
          <CreatorHub 
            notes={notes}
          />
        );
      case ViewType.AUTOFLOW:
        return <AutoFlowStudio />;
      case ViewType.LIVE_TUTOR:
        return (
          <div className="h-full flex items-center justify-center p-8 bg-[#0F0F1A]">
             <LiveTutor />
          </div>
        );
      case ViewType.GENERATE_VIDEO:
        return <ScriptToVideo />;
      default:
        return <StudyLab notes={notes} setNotes={setNotes} onTransform={handleTransform} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout}>
      {renderContent()}
    </Layout>
  );
};

export default Dashboard;