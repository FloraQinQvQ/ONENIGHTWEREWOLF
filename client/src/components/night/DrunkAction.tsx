import { useState } from 'react';
import { getSocket } from '../../socket';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function DrunkAction({ request: _ }: Props) {
  const [pending, setPending] = useState<0 | 1 | 2 | null>(null);

  const take = () => {
    if (pending === null) return;
    getSocket().emit('game:night_action', { action: { type: 'drunk:take_center', centerIndex: pending } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🍺</div>
      <h2 className="text-xl font-bold text-amber-400 mb-2">You are the Drunk!</h2>
      <p className="text-gray-400 mb-4">You must swap your card with a center card. You won't know what you got!</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {([0, 1, 2] as const).map(i => (
          <button
            key={i}
            onClick={() => setPending(i)}
            className={`card transition-all py-8 ${pending === i ? 'border-amber-500 bg-amber-500/10' : 'hover:border-amber-500/50'}`}
          >
            <p className="text-2xl">🃏</p>
            <p className="text-sm text-gray-400 mt-1">Center {i + 1}</p>
            {pending === i && <p className="text-xs text-amber-400 mt-1">✓</p>}
          </button>
        ))}
      </div>
      <button
        onClick={take}
        disabled={pending === null}
        className="btn-primary w-full py-3"
      >
        {pending !== null ? `Confirm — Take Center ${pending + 1}` : 'Select a center card'}
      </button>
    </div>
  );
}
