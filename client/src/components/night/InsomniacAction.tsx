import { getSocket } from '../../socket';

export default function InsomniacAction() {
  const check = () => {
    getSocket().emit('game:night_action', { action: { type: 'insomniac:view' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">👁️</div>
      <h2 className="text-xl font-bold text-cyan-400 mb-2">You are the Insomniac!</h2>
      <p className="text-gray-400 mb-4">Wake up and check your card. It may have changed during the night!</p>
      <button onClick={check} className="btn-primary w-full py-3">Check my card</button>
    </div>
  );
}
