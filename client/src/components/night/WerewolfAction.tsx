import { useState } from 'react';
import { getSocket } from '../../socket';
import { useT } from '../../i18n';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function WerewolfAction({ request }: Props) {
  const t = useT();
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
        <p className="text-gray-400">{t('waitingOthers')}</p>
      </div>
    );
  }

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🐺</div>
      <h2 className="text-xl font-bold text-red-400 mb-2">{t('na.werewolf.title')}</h2>

      {request.isLoneWolf ? (
        <>
          <p className="text-gray-400 mb-4">{t('na.werewolf.loneDesc')}</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[0, 1, 2].map(i => (
              <button
                key={i}
                onClick={() => setPendingCenter(i)}
                className={`card transition-all py-6 ${pendingCenter === i ? 'border-red-500 bg-red-500/10' : 'hover:border-red-500/50'}`}
              >
                <p className="text-sm text-gray-400">{t('na.seer.center', { n: i + 1 })}</p>
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
            {pendingCenter !== null ? t('na.werewolf.confirmPeek', { n: pendingCenter + 1 }) : t('na.werewolf.selectCard')}
          </button>
          <button onClick={() => submit()} className="btn-ghost w-full">
            {t('na.werewolf.skip')}
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-400 mb-4">{t('na.werewolf.packDesc')}</p>
          <div className="card mb-4">
            {request.players.length > 0 ? (
              <div className="space-y-2">
                {request.players.map(p => (
                  <div key={p.userId} className="text-red-400 font-semibold">{p.displayName} 🐺</div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">{t('na.werewolf.noOthers')}</p>
            )}
          </div>
          <button onClick={() => submit()} className="btn-primary w-full py-3">
            {t('na.werewolf.gotIt')}
          </button>
        </>
      )}
    </div>
  );
}
