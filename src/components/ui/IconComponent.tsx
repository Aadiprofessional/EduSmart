import React from 'react';
import { IconBaseProps, IconType } from 'react-icons';

interface IconComponentProps extends IconBaseProps {
  icon: IconType;
}

const IconComponent: React.FC<IconComponentProps> = ({ icon, ...props }) => {
  // Using type assertion to convert IconType to a valid JSX element
  const IconElement = icon as React.ElementType;
  return <IconElement {...props} />;
};

export default IconComponent; 