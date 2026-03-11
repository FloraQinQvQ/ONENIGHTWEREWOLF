import { getSocket } from '../../socket';
import { useT } from '../../i18n';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function MinionAction({ request: _ }: Props) {
  const t = useT();

  const submit = () => {
    getSocket().emit('game:night_action', { action: { type: 'minion:view' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🦹</div>
      <h2 className="text-xl font-bold text-orange-400 mb-2">{t('na.minion.title')}</h2>
      <p className="text-gray-400 mb-4">{t('na.minion.desc')}</p>
      <button onClick={submit} className="btn-primary w-full py-3">{t('na.minion.gotIt')}</button>
    </div>
  );
}
