'use client';

import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface AnimatedContainerProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedContainer({ 
  children, 
  delay = 0, 
  className = '' 
}: AnimatedContainerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface FadeInProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function FadeIn({ 
  children, 
  direction = 'up', 
  delay = 0, 
  className = '' 
}: FadeInProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ 
  children, 
  staggerDelay = 0.1, 
  className = '' 
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}