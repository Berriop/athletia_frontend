import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Save, X, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import type { UpdateProfileDTO } from '../services/auth.service';
import { useNotification } from '../contexts/NotificationContext';
import { NumberInput } from '../components/NumberInput';
import { toLocalDateInput } from '../utils/date';
import { FormValidationError, getErrorMessage, parseOptionalNumberField } from '../utils/formValidation';
import { EXPERIENCE_LEVEL_LABELS, GENDER_LABELS, ROLE_LABELS, formatDateOnly } from '../utils/labels';

const GENDERS = Object.keys(GENDER_LABELS) as (keyof typeof GENDER_LABELS)[];
const EXPERIENCE_LEVELS = Object.keys(EXPERIENCE_LEVEL_LABELS) as (keyof typeof EXPERIENCE_LEVEL_LABELS)[];
const MIN_BIRTH_DATE = '1900-01-01';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form fields
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [birthDate, setBirthDate] = useState(
    user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
  );
  const [heightCm, setHeightCm] = useState(user?.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(user?.weightKg?.toString() ?? '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || '');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'athletia_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      addNotification('Datos exportados correctamente', 'success');
    } catch {
      addNotification('Error al exportar los datos', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = () => {
    // Reset form to current user values
    setName(user?.name || '');
    setGender(user?.gender || '');
    setBirthDate(user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '');
    setHeightCm(user?.heightCm?.toString() ?? '');
    setWeightKg(user?.weightKg?.toString() ?? '');
    setExperienceLevel(user?.experienceLevel || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (birthDate && (birthDate < MIN_BIRTH_DATE || birthDate > toLocalDateInput(new Date()))) {
        throw new FormValidationError('La fecha de nacimiento debe estar entre 1900 y hoy');
      }
      // Un campo vacío se envía como null para que el valor anterior se borre.
      const dto: UpdateProfileDTO = {
        name: name.trim() || null,
        gender: gender || null,
        birthDate: birthDate || null,
        heightCm: parseOptionalNumberField(heightCm, { label: 'altura', min: 50, max: 300 }),
        weightKg: parseOptionalNumberField(weightKg, { label: 'peso', min: 20, max: 300 }),
        experienceLevel: experienceLevel || null,
      };
      const updatedUser = await authService.updateProfile(dto);
      updateUser(updatedUser);
      addNotification('Perfil actualizado correctamente', 'success');
      setIsEditing(false);
    } catch (err) {
      addNotification(getErrorMessage(err, 'Error al actualizar el perfil'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--border)',
    fontSize: '0.95rem',
  };
  const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)', minWidth: '160px' };
  const valueStyle: React.CSSProperties = { fontWeight: 500 };

  const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--background)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    minWidth: '180px',
    fontFamily: 'inherit',
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Mi Perfil</h1>
      <p className="page-subtitle">Tu información personal</p>

      <div className="card glass-panel" style={{ maxWidth: '600px' }}>
        {/* Avatar & name header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: '#fff'
          }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{user.name || 'Sin nombre'}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
          {!isEditing && (
            <button onClick={handleEdit} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Edit2 size={16} />
              Editar perfil
            </button>
          )}
        </div>

        {/* View Mode */}
        {!isEditing && (
          <>
            <div style={fieldStyle}>
              <span style={labelStyle}>Email</span>
              <span style={valueStyle}>{user.email}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Nombre</span>
              <span style={valueStyle}>{user.name || '—'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Rol</span>
              <span style={valueStyle}>{ROLE_LABELS[user.role] ?? user.role}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Género</span>
              <span style={valueStyle}>{user.gender ? GENDER_LABELS[user.gender] ?? user.gender : '—'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Fecha de nacimiento</span>
              <span style={valueStyle}>{user.birthDate ? formatDateOnly(user.birthDate) : '—'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Altura</span>
              <span style={valueStyle}>{user.heightCm ? `${user.heightCm} cm` : '—'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Peso</span>
              <span style={valueStyle}>{user.weightKg ? `${user.weightKg} kg` : '—'}</span>
            </div>
            <div style={{ ...fieldStyle, border: 'none' }}>
              <span style={labelStyle}>Nivel de experiencia</span>
              <span style={valueStyle}>{user.experienceLevel ? EXPERIENCE_LEVEL_LABELS[user.experienceLevel] ?? user.experienceLevel : '—'}</span>
            </div>
          </>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <form onSubmit={handleSave}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Nombre</span>
              <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Género</span>
              <select style={inputStyle} value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Sin especificar</option>
                {GENDERS.map((value) => (
                  <option key={value} value={value}>{GENDER_LABELS[value]}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Fecha de nacimiento</span>
              <input style={inputStyle} type="date" min={MIN_BIRTH_DATE} max={toLocalDateInput(new Date())} value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Altura (cm)</span>
              <NumberInput style={inputStyle} allowDecimal value={heightCm} onChange={setHeightCm} placeholder="Ej. 175" />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Peso (kg)</span>
              <NumberInput style={inputStyle} allowDecimal value={weightKg} onChange={setWeightKg} placeholder="Ej. 70" />
            </div>
            <div style={{ ...fieldStyle, border: 'none' }}>
              <span style={labelStyle}>Nivel de experiencia</span>
              <select style={inputStyle} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                <option value="">Sin especificar</option>
                {EXPERIENCE_LEVELS.map((value) => (
                  <option key={value} value={value}>{EXPERIENCE_LEVEL_LABELS[value]}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" disabled={isSaving} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={handleCancel} disabled={isSaving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                <X size={16} />
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer',
              backgroundColor: 'transparent', border: '1px solid var(--primary)',
              color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem',
            }}
          >
            <Download size={16} />
            {isExporting ? 'Exportando...' : 'Exportar mis datos (CSV)'}
          </button>
          <button
            onClick={handleLogout}
            className="btn-primary"
            style={{ backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
