import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const checkPasswordStrength = (password: string) => {
  const rules = [
    { label: 'Al menos 12 caracteres', pass: password.length >= 12 },
    { label: 'Una letra mayúscula (A-Z)', pass: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula (a-z)', pass: /[a-z]/.test(password) },
    { label: 'Un número (0-9)', pass: /[0-9]/.test(password) },
    { label: 'Un carácter especial (!@#$%...)', pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const passedCount = rules.filter((r) => r.pass).length;
  const isStrong = passedCount === 5;

  let strengthLabel = 'Sin contraseña';
  let strengthColor = '#6b7280'; // gray
  let percentage = 0;

  if (password.length > 0) {
    if (passedCount <= 2) {
      strengthLabel = 'Muy Débil';
      strengthColor = '#ef4444'; // red
      percentage = 25;
    } else if (passedCount <= 3) {
      strengthLabel = 'Regular';
      strengthColor = '#f97316'; // orange
      percentage = 50;
    } else if (passedCount === 4) {
      strengthLabel = 'Buena';
      strengthColor = '#3b82f6'; // blue
      percentage = 75;
    } else {
      strengthLabel = 'Fuerte y Segura ✨';
      strengthColor = '#10b981'; // green
      percentage = 100;
    }
  }

  return { rules, passedCount, isStrong, strengthLabel, strengthColor, percentage };
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const { rules, strengthLabel, strengthColor, percentage } = checkPasswordStrength(password);

  return (
    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Strength indicator header & progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Nivel de seguridad:</span>
          <span style={{ color: strengthColor }}>{strengthLabel}</span>
        </div>
        <div
          style={{
            height: '6px',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              backgroundColor: strengthColor,
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Rules checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem', marginTop: '0.25rem' }}>
        {rules.map((rule, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: rule.pass ? '#10b981' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              transition: 'color 0.2s ease',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>{rule.pass ? '✓' : '○'}</span>
            <span style={{ textDecoration: rule.pass ? 'none' : 'none' }}>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
