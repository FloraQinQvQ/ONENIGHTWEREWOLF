import { getSocket } from '../../socket';
import { useT } from '../../i18n';

export default function InsomniacAction() {
  const t = useT();

  const check = () => {
    getSocket().emit('game:night_action', { action: { type: 'insomniac:view' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">👁️</div>
      <h2 className="text-xl font-bold text-cyan-400 mb-2">{t('na.insomniac.title')}</h2>
      <p className="text-gray-400 mb-4">{t('na.insomniac.desc')}</p>
      <button onClick={check} className="btn-primary w-full py-3">{t('na.insomniac.gotIt')}</button>
    </div>
  );
}
