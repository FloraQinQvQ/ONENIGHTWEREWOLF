import { useState } from 'react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { getSocket } from '../../socket';
import { useT } from '../../i18n';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; currentUserId: string; }

export default function TroublemakerAction({ request, currentUserId: _ }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const submit = () => {
    if (selected.length !== 2) return;
    getSocket().emit('game:night_action', {
      action: { type: 'troublemaker:swap', targetUserIds: [selected[0], selected[1]] },
    });
  };

  const skip = () => {
    getSocket().emit('game:night_action', { action: { type: 'no_action' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">😈</div>
      <h2 className="text-xl font-bold text-pink-400 mb-2">{t('na.troublemaker.title')}</h2>
      <p className="text-gray-400 mb-1">{t('na.troublemaker.desc')}</p>
      <p className="text-sm text-gray-500 mb-4">{t('na.troublemaker.selected', { n: selected.length })}</p>
      <div className="space-y-3 mb-4">
        {request.players.map(p => (
          <button
            key={p.userId}
            onClick={() => toggle(p.userId)}
            className={`card w-full flex items-center gap-3 transition-all ${selected.includes(p.userId) ? 'border-pink-500 bg-pink-500/10' : 'hover:border-pink-500/50'}`}
          >
            <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={8} />
            <span className="flex-1 text-left">{p.displayName}</span>
            {selected.includes(p.userId) && <span className="text-pink-400">✓</span>}
          </button>
        ))}
      </div>
      <button onClick={submit} disabled={selected.length !== 2} className="btn-primary w-full mb-2">
        {t('na.troublemaker.swap')}
      </button>
      <button onClick={skip} className="btn-ghost w-full">{t('na.troublemaker.skip')}</button>
    </div>
  );
}
