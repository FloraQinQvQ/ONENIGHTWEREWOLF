import { useState } from 'react';
import { getSocket } from '../../socket';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function SeerAction({ request }: Props) {
  const [mode, setMode] = useState<'choose' | 'player' | 'center' | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const submitPlayer = (targetUserId: string) => {
    getSocket().emit('game:night_action', { action: { type: 'seer:view_player', targetUserId } });
  };

  const submitCenter = () => {
    if (selected.length !== 2) return;
    getSocket().emit('game:night_action', {
      action: { type: 'seer:view_center', centerIndices: [parseInt(selected[0]), parseInt(selected[1])] },
    });
  };

  const toggleCenter = (i: string) => {
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 2 ? [...prev, i] : prev
    );
  };

  if (!mode) {
    return (
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-3">🔮</div>
        <h2 className="text-xl font-bold text-purple-400 mb-2">You are the Seer!</h2>
        <p className="text-gray-400 mb-4">Look at one player's card OR two center cards.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setMode('player')} className="card hover:border-purple-500/50 transition-all py-6">
            <p className="text-2xl mb-1">👤</p>
            <p className="text-sm text-gray-300">View a player's card</p>
          </button>
          <button onClick={() => setMode('center')} className="card hover:border-purple-500/50 transition-all py-6">
            <p className="text-2xl mb-1">🃏</p>
            <p className="text-sm text-gray-300">View 2 center cards</p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'player') {
    return (
      <div className="text-center max-w-sm w-full">
        <div className="text-4xl mb-3">🔮</div>
        <h2 className="text-lg font-bold text-purple-400 mb-4">Choose a player to view:</h2>
        <div className="space-y-3">
          {request.players.map(p => (
            <button
              key={p.userId}
              onClick={() => submitPlayer(p.userId)}
              className="card w-full flex items-center gap-3 hover:border-purple-500/50 transition-all"
            >
              {p.avatarUrl
                ? <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                : <div className="w-8 h-8 rounded-full bg-night-700 flex items-center justify-center">{p.displayName[0]}</div>
              }
              <span>{p.displayName}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setMode(null)} className="btn-ghost mt-3 w-full">Back</button>
      </div>
    );
  }

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-4xl mb-3">🔮</div>
      <h2 className="text-lg font-bold text-purple-400 mb-2">Choose 2 center cards:</h2>
      <p className="text-sm text-gray-400 mb-4">{selected.length}/2 selected</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[0, 1, 2].map(i => (
          <button
            key={i}
            onClick={() => toggleCenter(String(i))}
            className={`card py-6 transition-all ${selected.includes(String(i)) ? 'border-purple-500 bg-purple-500/10' : 'hover:border-purple-500/40'}`}
          >
            <p className="text-sm text-gray-400">Center {i + 1}</p>
            <p className="text-2xl">🃏</p>
            {selected.includes(String(i)) && <p className="text-xs text-purple-400">✓</p>}
          </button>
        ))}
      </div>
      <button onClick={submitCenter} disabled={selected.length !== 2} className="btn-primary w-full mb-2">
        Reveal Cards
      </button>
      <button onClick={() => setMode(null)} className="btn-ghost w-full">Back</button>
    </div>
  );
}
