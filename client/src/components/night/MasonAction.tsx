import { getSocket } from '../../socket';
import { useT } from '../../i18n';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function MasonAction({ request: _ }: Props) {
  const t = useT();

  const submit = () => {
    getSocket().emit('game:night_action', { action: { type: 'mason:view' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🔨</div>
      <h2 className="text-xl font-bold text-blue-400 mb-2">{t('na.mason.title')}</h2>
      <p className="text-gray-400 mb-4">{t('na.mason.desc')}</p>
      <button onClick={submit} className="btn-primary w-full py-3">{t('na.mason.gotIt')}</button>
    </div>
  );
}
