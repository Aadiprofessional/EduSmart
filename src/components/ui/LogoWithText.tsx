import React from 'react';
import matrixLogo from '../../assets/logoround.png';

interface Props {
  size?: number; // px
  maxTextWidth?: number; // px
  title?: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showSubtitle?: boolean;
}

const LogoWithText: React.FC<Props> = ({
  size = 32,
  maxTextWidth = 140,
  title = 'MatrixEdu',
  subtitle = 'MatrixAI Company Limited',
  className = '',
  titleClassName = 'font-bold text-gray-900 dark:text-white truncate leading-tight',
  subtitleClassName = 'text-[11px] text-gray-500 dark:text-gray-400 truncate',
  showSubtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={matrixLogo} alt={`${title} logo`} style={{ width: size, height: size }} className="rounded-xl object-cover flex-shrink-0" />
      <div style={{ maxWidth: maxTextWidth }} className="flex flex-col overflow-hidden">
        <span className={titleClassName}>{title}</span>
        {showSubtitle && (
          <span className={subtitleClassName}>{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default LogoWithText;
