import { getSocket } from '../../socket';
import type { RoleName } from 'shared';
import { ROLE_INFO } from '../../utils/roleInfo';

interface Props { role: RoleName; }

export default function NoAction({ role }: Props) {
  const info = ROLE_INFO[role];

  const submit = () => {
    getSocket().emit('game:night_action', { action: { type: 'no_action' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">{info.emoji}</div>
      <h2 className={`text-xl font-bold mb-2 ${info.color}`}>You are the {info.name}!</h2>
      <p className="text-gray-400 mb-4">{info.nightAction}</p>
      <button onClick={submit} className="btn-primary w-full py-3">OK, got it</button>
    </div>
  );
}
