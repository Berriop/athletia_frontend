import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface BenefitItemProps {
  title: string;
  description: string;
}

export const BenefitItem: React.FC<BenefitItemProps> = ({ title, description }) => (
  <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
    <CheckCircle2 color="var(--secondary)" size={24} style={{ flexShrink: 0 }} />
    <div>
      <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>{title}</h4>
      <p style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  </li>
);
