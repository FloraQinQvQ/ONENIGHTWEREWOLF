import { useState } from 'react';
import { getSocket } from '../../socket';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; currentUserId: string; }

export default function TroublemakerAction({ request, currentUserId: _ }: Props) {
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
      <h2 className="text-xl font-bold text-pink-400 mb-2">You are the Troublemaker!</h2>
      <p className="text-gray-400 mb-1">Swap two other players' cards (optional).</p>
      <p className="text-sm text-gray-500 mb-4">{selected.length}/2 selected</p>
      <div className="space-y-3 mb-4">
        {request.players.map(p => (
          <button
            key={p.userId}
            onClick={() => toggle(p.userId)}
            className={`card w-full flex items-center gap-3 transition-all ${selected.includes(p.userId) ? 'border-pink-500 bg-pink-500/10' : 'hover:border-pink-500/50'}`}
          >
            {p.avatarUrl
              ? <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
              : <div className="w-8 h-8 rounded-full bg-night-700 flex items-center justify-center">{p.displayName[0]}</div>
            }
            <span className="flex-1 text-left">{p.displayName}</span>
            {selected.includes(p.userId) && <span className="text-pink-400">✓</span>}
          </button>
        ))}
      </div>
      <button onClick={submit} disabled={selected.length !== 2} className="btn-primary w-full mb-2">
        Swap Cards
      </button>
      <button onClick={skip} className="btn-ghost w-full">Don't swap</button>
    </div>
  );
}
