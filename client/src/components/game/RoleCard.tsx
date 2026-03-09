import { useState } from 'react';
import type { RoleName } from 'shared';
import { ROLE_INFO } from '../../utils/roleInfo';

interface Props {
  role: RoleName;
  onReady: () => void;
}

export default function RoleCard({ role, onReady }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const info = ROLE_INFO[role];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-night-950">
      <div className="text-center mb-6">
        <h2 className="text-xl text-gray-400">Your Secret Role</h2>
        <p className="text-sm text-gray-600 mt-1">Don't show your screen to others!</p>
      </div>

      <div
        className={`relative w-64 h-96 cursor-pointer transition-all duration-500 ${revealed ? '' : 'hover:scale-105'}`}
        style={{ perspective: '1000px' }}
        onClick={() => !revealed && setRevealed(true)}
      >
        <div
          className="w-full h-full relative transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: revealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
          }}
        >
          {/* Front - role revealed */}
          <div
            className="absolute inset-0 bg-night-800 border-2 border-moon-500/50 rounded-2xl flex flex-col items-center justify-center p-6 gap-4"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-7xl">{info.emoji}</div>
            <h3 className={`text-3xl font-bold ${info.color}`}>{info.name}</h3>
            <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
              info.team === 'village' ? 'bg-green-500/20 text-green-400' :
              info.team === 'werewolf' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {info.team === 'village' ? 'Village Team' : info.team === 'werewolf' ? 'Werewolf Team' : 'Solo'}
            </div>
            <p className="text-gray-300 text-sm text-center leading-relaxed">{info.description}</p>
          </div>

          {/* Back - hidden */}
          <div
            className="absolute inset-0 bg-night-800 border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center gap-4"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-6xl">🌙</div>
            <p className="text-gray-400 text-sm">Tap to reveal your role</p>
            <div className="text-4xl">❓</div>
          </div>
        </div>
      </div>

      {revealed && !confirmed && (
        <div className="mt-8 text-center max-w-sm">
          <div className="card mb-4">
            <p className="text-sm text-gray-400 font-semibold mb-1">Night Action:</p>
            <p className="text-gray-200 text-sm">{info.nightAction}</p>
          </div>
          <button
            onClick={() => { setConfirmed(true); onReady(); }}
            className="btn-primary w-full py-3"
          >
            I've memorized my role — Ready!
          </button>
        </div>
      )}

      {confirmed && (
        <div className="mt-8 text-center">
          <div className="text-green-400 text-lg font-semibold">✓ Ready!</div>
          <p className="text-gray-500 text-sm mt-1">Waiting for other players...</p>
        </div>
      )}

      {!revealed && (
        <p className="mt-8 text-gray-600 text-sm">Tap the card to see your role</p>
      )}
    </div>
  );
}
