import { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import UserAvatar from '../UserAvatar';

const LivePresenceBar = () => {
  const ctx = useContext(AppContext);
  const [teamInsight, setTeamInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const online = ctx?.memberPresence.filter((p) => p.status === 'Online') ?? [];

  useEffect(() => {
    if (!ctx?.backendOnline || !ctx.activeWorkspace || online.length === 0) {
      setTeamInsight('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setInsightLoading(true);
      try {
        const { insight } = await ctx.getCollaborationInsight();
        setTeamInsight(insight);
      } catch {
        setTeamInsight('');
      } finally {
        setInsightLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [ctx, online.length, ctx?.memberPresence, ctx?.activeWorkspace?.id, ctx?.backendOnline]);

  if (!ctx || online.length === 0) return null;

  const { activeWorkspace } = ctx;

  return (
    <div className="live-presence-bar glass">
      <span className="live-pulse-dot" aria-hidden />
      <span className="live-presence-label">Live now</span>
      <div className="live-presence-members">
        {online.map((p) => {
          const name = p.userName ?? activeWorkspace?.members.find((m) => m.id === p.userId)?.name ?? 'Teammate';
          return (
            <div key={p.userId} className="live-presence-chip" title={p.activity ?? p.status}>
              <UserAvatar name={name} size="xs" noBorder />
              <span>{name}</span>
              {p.viewingTaskId && (
                <span className="live-presence-viewing">
                  {p.viewingTask ? `on "${p.viewingTask}"` : 'viewing a task'}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {(teamInsight || insightLoading) && (
        <p className="live-presence-ai" aria-live="polite">
          {insightLoading ? 'Analyzing team focus…' : teamInsight}
        </p>
      )}
    </div>
  );
};

export default LivePresenceBar;
