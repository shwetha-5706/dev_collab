import { useMemo } from 'react';
import { motion } from 'framer-motion';

const codeLines = [
  'const app = createApp();',
  'await db.connect();',
  'export default router;',
  'git push origin main',
  'npm run build',
  'socket.emit("sync");',
  'return <Dashboard />;',
  'useEffect(() => {}, []);',
  'type Task = { id: string };',
  'pnpm dev --port 5173',
];

const AuthBackground = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 12 + Math.random() * 18,
        delay: Math.random() * 5,
      })),
    []
  );

  return (
    <div className="auth-background" aria-hidden>
      <div className="auth-code-rain">
        {codeLines.map((line, i) => (
          <motion.span
            key={line}
            className="auth-code-line"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: [0.08, 0.22, 0.08], x: [0, 12, 0] }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: `${8 + i * 9}%`, left: `${(i * 11) % 70}%` }}
          >
            {line}
          </motion.span>
        ))}
      </div>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="auth-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

export default AuthBackground;
