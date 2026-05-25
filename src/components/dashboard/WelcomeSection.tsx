import { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../../contexts/AppContext';
import { motivationalQuotes } from '../../data/mock';

const WelcomeSection = () => {
  const ctx = useContext(AppContext);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!ctx) return null;
  const { auth, tasks, activeWorkspace } = ctx;

  const greeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const completedThisWeek = tasks.filter((t) => t.status === 'Done').length;
  const quote = motivationalQuotes[now.getDay() % motivationalQuotes.length];

  return (
    <motion.div
      className="hero-panel glass section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div>
          <p className="overline">{greeting()}, {auth.user?.name} 👋</p>
          <h1 style={{ margin: '10px 0 8px', fontSize: '1.8rem' }}>
            Mission Control — {activeWorkspace?.name}
          </h1>
          <p style={{ opacity: 0.85, marginBottom: 12 }}>
            You completed <strong>{completedThisWeek} tasks</strong> this week
          </p>
          <p style={{ opacity: 0.65, fontStyle: 'italic', fontSize: '0.9rem' }}>"{quote}"</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>
            {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="small-badge" style={{ marginTop: 12 }}>
            AI: Team synergy at {activeWorkspace?.settings.collaborationScore}%
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeSection;
