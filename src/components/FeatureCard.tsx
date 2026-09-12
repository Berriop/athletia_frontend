import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  iconBg?: string;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, iconBg, title, description }) => (
  <div className="feature-card card">
    <div className="feature-icon-wrapper" style={iconBg ? { background: iconBg } : undefined}>
      <Icon size={32} />
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </div>
);
