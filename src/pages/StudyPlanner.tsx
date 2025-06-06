import React from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { getTranslation } from '../utils/i18n';
import Header from '../components/layout/Header';
import StudyPlannerComponent from '../components/ui/StudyPlannerComponent';

const StudyPlanner: React.FC = () => {
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {t('aiStudy.studyPlannerCalendar')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('aiStudy.subtitle')}
            </p>
          </div>

          {/* Study Planner Component */}
          <StudyPlannerComponent />
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner; 