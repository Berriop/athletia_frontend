import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "¿Qué es Athletia?",
    answer: "Athletia es una plataforma integral de seguimiento del rendimiento diseñada para atletas. Te permite monitorear tus entrenamientos, nutrición, sueño y lesiones en un solo lugar, brindándote información procesable para mejorar tu rendimiento."
  },
  {
    question: "¿Cómo funciona el seguimiento de entrenamientos?",
    answer: "Puedes registrar tus ejercicios diarios, incluyendo series, repeticiones, peso y tiempos de descanso. Athletia visualiza estos datos a lo largo del tiempo para que puedas seguir tu progresión y asegurarte de aplicar la sobrecarga progresiva correctamente."
  },
  {
    question: "¿Puedo monitorear mi sueño?",
    answer: "Sí, nuestro módulo de seguimiento de sueño te permite registrar tus horas y calidad de sueño. Correlacionar tus datos de sueño con el rendimiento de tus entrenamientos es clave para entender tus necesidades de recuperación."
  },
  {
    question: "¿Cómo se manejan las lesiones?",
    answer: "Puedes registrar cualquier dolor, distensión o lesión, junto con los niveles de dolor y notas. Esto te ayuda a hacer un seguimiento de los tiempos de recuperación y a comunicarte eficazmente con fisioterapeutas o médicos."
  },
  {
    question: "¿Está segura mi información?",
    answer: "Absolutamente. Utilizamos cifrado estándar de la industria, JWT para la gestión de sesiones y bases de datos seguras (PostgreSQL) para garantizar que tus datos personales de salud y rendimiento se mantengan privados y seguros."
  },
  {
    question: "¿Necesito ser un atleta profesional?",
    answer: "Para nada. Athletia está diseñada para cualquier persona que se tome en serio sus objetivos de salud y estado físico. Ya seas un deportista de fin de semana, un competidor aficionado o un profesional, nuestras herramientas se adaptan a tu nivel."
  }
];

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="page-container" style={{ paddingTop: '4rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <h1 className="page-title" style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>Preguntas Frecuentes</h1>
      <p className="page-subtitle" style={{ textAlign: 'center', fontSize: '1.25rem', marginBottom: '4rem' }}>
        ¿Tienes dudas? Aquí tenemos las respuestas.
      </p>

      <div className="card" style={{ padding: '0' }}>
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <button 
              className="faq-question" 
              onClick={() => toggleFaq(index)}
              aria-expanded={openIndex === index}
            >
              <span>{faq.question}</span>
              {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
