import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab } from './types';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { ScheduleView } from './components/views/ScheduleView';
import { AttendanceView } from './components/views/AttendanceView';
import { ExamsView } from './components/views/ExamsView';
import { ResearchJuniorView } from './components/views/ResearchJuniorView';
import { ProfileView } from './components/views/ProfileView';
import { AuthView } from './components/views/AuthView';
import { ChangeBackgroundModal } from './components/modals/ChangeBackgroundModal';
import { SubjectDetailModal } from './components/modals/SubjectDetailModal';
import { VoiceNoteModal } from './components/modals/VoiceNoteModal';
import { SakuraPetals } from './components/effects/SakuraPetals';

function CampusBloomContent() {
  const {
    currentUser,
    profile,
    subjects,
    schedule,
    exams,
    currentBg,
    setCurrentBg,
    activeThemeId,
    setActiveThemeId,
    activeTab,
    setActiveTab,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isPetalsActive,
    setIsPetalsActive,
    isBgModalOpen,
    setIsBgModalOpen,
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    voicePromptPreset,
    selectedSubject,
    setSelectedSubject,
    showResearchTab,
    setShowResearchTab,
    handleLoginSuccess,
    handleLogout,
    updateProfile,
    updateSubject,
    updateAttendance,
    addClass,
    importSchedule,
    addExam,
    resetToBlankCanvas,
  } = useApp();

  const [customOverlay, setCustomOverlay] = useState<number>(0.2);

  return (
    <div
      id="campusbloom-root-container"
      data-theme={activeThemeId}
      className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden text-[#1b1c1c] selection:bg-[#ffb7c5] selection:text-[#514345]"
    >
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none z-0"
        style={{
          backgroundImage: `url("${currentBg.url}")`,
          transform: 'scale(1.02)',
        }}
      />

      {/* Atmospheric Soft Gradient / Frosted Blur Tint Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
        style={{
          backgroundColor: currentBg.isDark
            ? `rgba(20, 15, 18, ${customOverlay + 0.15})`
            : `rgba(253, 245, 246, ${customOverlay})`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Floating Sakura Petals Canvas Effect */}
      <SakuraPetals isActive={isPetalsActive} themeId={activeThemeId} />

      {/* If user is not authenticated, display botanical AuthView */}
      {!currentUser ? (
        <AuthView onLoginSuccess={handleLoginSuccess} />
      ) : (
        /* App Content Layer for Logged-In User */
        <div className="relative z-20 flex flex-col min-h-screen">
          {/* Top Header */}
          <Header
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            isPetalsActive={isPetalsActive}
            setIsPetalsActive={setIsPetalsActive}
            onOpenBackgroundModal={() => setIsBgModalOpen(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateToProfile={() => setActiveTab('perfil')}
          />

          {/* Main Content Layout with Left Sidebar + View Container */}
          <div className="flex-1 flex flex-col md:flex-row items-center md:items-start justify-center gap-4 sm:gap-6 px-3 sm:px-6 lg:px-8 py-2 md:py-6">
            {/* Vertical Sidebar */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              showResearchTab={showResearchTab}
              onLogout={handleLogout}
            />

            {/* Active Screen View */}
            <main className="flex-1 w-full max-w-7xl mx-auto pb-12 md:pb-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12, scale: 0.992 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.992 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="w-full"
                >
                  {activeTab === 'resumen' && (
                    <OverviewView
                      profile={profile}
                      subjects={subjects}
                      onOpenBackgroundModal={() => setIsBgModalOpen(true)}
                      onSelectSubject={(s) => setSelectedSubject(s)}
                      onNavigateToAttendance={() => setActiveTab('asistencia')}
                      onNavigateToExams={() => setActiveTab('examenes')}
                      onNavigateToResearch={() => setActiveTab('investigacion')}
                    />
                  )}

                  {activeTab === 'cronograma' && (
                    <ScheduleView />
                  )}

                  {activeTab === 'asistencia' && (
                    <AttendanceView />
                  )}

                  {activeTab === 'examenes' && (
                    <ExamsView />
                  )}

                  {activeTab === 'investigacion' && (
                    <ResearchJuniorView userEmail={currentUser.email} />
                  )}

                  {activeTab === 'perfil' && (
                    <ProfileView
                      currentUser={currentUser}
                      profile={profile}
                      currentBg={currentBg}
                      activeThemeId={activeThemeId}
                      showResearchTab={showResearchTab}
                      onToggleResearchTab={(val) => {
                        setShowResearchTab(val);
                      }}
                      onUpdateProfile={updateProfile}
                      onSelectBackground={setCurrentBg}
                      onSelectThemeId={(id) => setActiveThemeId(id)}
                      onResetDefaults={resetToBlankCanvas}
                      onLogout={handleLogout}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}

      {/* Modals */}
      <ChangeBackgroundModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        currentBg={currentBg}
        onSelectBackground={setCurrentBg}
        customOverlay={customOverlay}
        setCustomOverlay={setCustomOverlay}
      />

      <SubjectDetailModal
        subject={selectedSubject}
        isOpen={Boolean(selectedSubject)}
        onClose={() => setSelectedSubject(null)}
        onUpdateSubject={updateSubject}
      />

      <VoiceNoteModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialTranscript={voicePromptPreset}
        autoStartListening={!voicePromptPreset}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <CampusBloomContent />
    </AppProvider>
  );
}
