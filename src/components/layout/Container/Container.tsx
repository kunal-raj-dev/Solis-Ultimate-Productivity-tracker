import React, { HTMLAttributes } from 'react';
import { cn } from '../../../utils/classNames';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'default' | 'full';
}

export const Container: React.FC<ContainerProps> = ({
  size = 'default',
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        size === 'narrow' && 'container-narrow',
        size === 'default' && 'container-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
