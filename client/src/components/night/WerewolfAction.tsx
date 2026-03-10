import { useState } from 'react';
import { getSocket } from '../../socket';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function WerewolfAction({ request }: Props) {
  const [pendingCenter, setPendingCenter] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const submit = (centerIndex?: number) => {
    getSocket().emit('game:night_action', {
      action: { type: 'werewolf:view', ...(centerIndex !== undefined ? { centerIndex } : {}) },
    });
    setDone(true);
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🐺</div>
        <p className="text-gray-400">Waiting for others...</p>
      </div>
    );
  }

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🐺</div>
      <h2 className="text-xl font-bold text-red-400 mb-2">You are a Werewolf!</h2>

      {request.isLoneWolf ? (
        <>
          <p className="text-gray-400 mb-4">You are the only Werewolf. You may peek at one center card.</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setPendingCenter(i)}
                className={`card transition-all py-6 ${pendingCenter === i ? 'border-red-500 bg-red-500/10' : 'hover:border-red-500/50'}`}
              >
                <p className="text-sm text-gray-400">Center {i + 1}</p>
                <p className="text-2xl">🃏</p>
                {pendingCenter === i && <p className="text-xs text-red-400 mt-1">✓</p>}
              </button>
            ))}
          </div>
          <button
            onClick={() => submit(pendingCenter!)}
            disabled={pendingCenter === null}
            className="btn-primary w-full mb-2"
          >
            {pendingCenter !== null ? `Confirm — Peek Center ${pendingCenter + 1}` : 'Select a card to peek'}
          </button>
          <button onClick={() => submit()} className="btn-ghost w-full">
            Skip (don't peek)
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-400 mb-4">Look at the other players to see your fellow Werewolves.</p>
          <div className="card mb-4">
            {request.players.length > 0 ? (
              <div className="space-y-2">
                {request.players.map(p => (
                  <div key={p.userId} className="text-red-400 font-semibold">{p.displayName} 🐺</div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No other werewolves</p>
            )}
          </div>
          <button onClick={() => submit()} className="btn-primary w-full py-3">
            Got it — Close eyes
          </button>
        </>
      )}
    </div>
  );
}
