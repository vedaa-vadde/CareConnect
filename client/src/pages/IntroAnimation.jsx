import React, { useEffect, useState } from 'react';

const IntroAnimation = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); // 0=logo, 1=tagline, 2=fade-out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2500);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className="intro-wrapper" style={{ opacity: phase === 2 ? 0 : 1 }}>
      <div className="intro-bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="intro-content">
        <div className="intro-icon-ring">
          <span className="intro-icon">🏠</span>
        </div>

        <h1 className="intro-title" style={{ animationDelay: '0.3s' }}>
          CareConnect
        </h1>

        <p className="intro-tagline" style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)' }}>
          Trusted help, right at your doorstep. 🌿✨
        </p>

        <div className="intro-icons-row" style={{ opacity: phase >= 1 ? 1 : 0 }}>
          {['🧺', '❄️', '⚡', '🚰', '🧹', '🔧', '🏠'].map((icon, i) => (
            <span key={i} className="intro-service-icon" style={{ animationDelay: `${i * 0.08}s` }}>
              {icon}
            </span>
          ))}
        </div>

        <div className="intro-loading-bar" style={{ opacity: phase >= 1 ? 1 : 0 }}>
          <div className="intro-loading-fill" />
        </div>
      </div>

      <button className="intro-skip" onClick={onComplete}>
        Skip →
      </button>

      <style>{`
        .intro-wrapper {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #f0f7f3 0%, #fdf9f5 50%, #f0f7f3 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: opacity 0.6s ease;
        }

        .intro-bg-blobs {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
        }

        .blob-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #6aaa7e 0%, transparent 70%);
          top: -100px; left: -100px;
          animation: blobFloat 6s ease-in-out infinite;
        }

        .blob-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #a8d4b4 0%, transparent 70%);
          bottom: -80px; right: -80px;
          animation: blobFloat 8s ease-in-out infinite reverse;
        }

        .blob-3 {
          width: 250px; height: 250px;
          background: radial-gradient(circle, #eedcd0 0%, transparent 70%);
          top: 50%; left: 60%;
          animation: blobFloat 7s ease-in-out infinite 2s;
        }

        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }

        .intro-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          animation: introSlideIn 0.7s ease both;
        }

        .intro-icon-ring {
          width: 96px;
          height: 96px;
          background: linear-gradient(135deg, #4a7c59, #6aaa7e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 20px 50px rgba(74,124,89,0.3);
          animation: pulse 2s ease-in-out infinite;
        }

        .intro-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 800;
          background: linear-gradient(135deg, #315a3e 0%, #4a7c59 50%, #6aaa7e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -1px;
          line-height: 1;
          margin: 0;
        }

        .intro-tagline {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: #4a5568;
          font-weight: 400;
          transition: all 0.6s ease;
          text-align: center;
        }

        .intro-icons-row {
          display: flex;
          gap: 0.75rem;
          transition: opacity 0.6s ease;
          flex-wrap: wrap;
          justify-content: center;
        }

        .intro-service-icon {
          font-size: 1.75rem;
          animation: iconBounce 0.5s ease both;
          display: inline-block;
        }

        @keyframes iconBounce {
          0% { opacity: 0; transform: translateY(20px) scale(0.5); }
          60% { transform: translateY(-4px) scale(1.1); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .intro-loading-bar {
          width: 200px;
          height: 4px;
          background: rgba(74,124,89,0.15);
          border-radius: 2px;
          overflow: hidden;
          transition: opacity 0.4s ease;
        }

        .intro-loading-fill {
          height: 100%;
          background: linear-gradient(90deg, #4a7c59, #6aaa7e);
          border-radius: 2px;
          animation: loadFill 2s ease forwards;
        }

        @keyframes loadFill {
          from { width: 0%; }
          to { width: 100%; }
        }

        .intro-skip {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          background: rgba(74,124,89,0.1);
          border: 1px solid rgba(74,124,89,0.2);
          color: #4a7c59;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
        }

        .intro-skip:hover {
          background: rgba(74,124,89,0.2);
        }
      `}</style>
    </div>
  );
};

export default IntroAnimation;
