import React from 'react';
import { IconBaseProps, IconType } from 'react-icons';

interface IconComponentProps extends IconBaseProps {
  icon: IconType;
}

const IconComponent: React.FC<IconComponentProps> = ({ icon, ...props }) => {
  const Icon = icon as React.ComponentType<IconBaseProps>;
  return <Icon {...props} />;
};

export default IconComponent; 