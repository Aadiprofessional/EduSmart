import React from 'react';
import StudyTimer from '../components/study-set/StudyTimer';

const TimerPage: React.FC = () => {
    return (
        <div className="w-screen h-screen bg-white dark:bg-[#111111] overflow-hidden flex items-center justify-center">
            <StudyTimer 
                isOpen={true} 
                onClose={() => {}} 
                isStandalone={true} 
            />
        </div>
    );
};

export default TimerPage;
