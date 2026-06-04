import React, { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app we'd send this to an API
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
  };

  return (
    <div className="page-container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="page-title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Ponte en Contacto</h1>
        <p className="page-subtitle" style={{ fontSize: '1.25rem' }}>
          ¿Tienes alguna pregunta o comentario? Nos encantaría escucharte.
        </p>
      </div>

      <div className="card">
        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Send size={32} />
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Gracias por contactar a Athletia.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Nos pondremos en contacto contigo pronto.</p>
            <button 
              onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
              className="btn-primary"
              style={{ marginTop: '2rem' }}
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-2" style={{ gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="name" className="form-label">Nombre</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="email" className="form-label">Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="tu.correo@ejemplo.com"
                  />
                  <Mail size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="subject" className="form-label">Asunto</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="message" className="form-label">Mensaje</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="form-textarea"
                  placeholder="Cuéntanos más sobre tu consulta..."
                ></textarea>
                <MessageSquare size={18} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Enviar Mensaje
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
