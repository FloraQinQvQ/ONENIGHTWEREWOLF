import type { RoleName } from 'shared';
import { ALL_ROLES, ROLE_INFO } from '../../utils/roleInfo';

interface Props {
  selected: RoleName[];
  onChange: (roles: RoleName[]) => void;
  required: number;
  disabled: boolean;
}

export default function RoleSelector({ selected, onChange, required, disabled }: Props) {
  const count = selected.length;

  const toggle = (role: RoleName) => {
    if (disabled) return;
    if (multiRoles.includes(role)) return; // handled by +/- buttons
    if (selected.includes(role)) {
      onChange(selected.filter(r => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  // Count occurrences
  const counts: Record<string, number> = {};
  for (const r of selected) counts[r] = (counts[r] ?? 0) + 1;

  const addOne = (role: RoleName) => {
    if (disabled) return;
    onChange([...selected, role]);
  };

  const removeOne = (role: RoleName) => {
    if (disabled) return;
    const lastIdx = selected.lastIndexOf(role);
    if (lastIdx !== -1) {
      onChange([...selected.slice(0, lastIdx), ...selected.slice(lastIdx + 1)]);
    }
  };

  const multiRoles = ['werewolf', 'mason', 'villager'];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {ALL_ROLES.map(role => {
          const info = ROLE_INFO[role];
          const roleCount = counts[role] ?? 0;
          const isSelected = roleCount > 0;
          return (
            <button
              key={role}
              onClick={() => toggle(role)}
              disabled={disabled}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-moon-500/60 bg-moon-500/10'
                  : 'border-white/10 bg-night-700 hover:border-white/30'
              } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-xl">{info.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? info.color : 'text-gray-300'}`}>
                  {info.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {info.team === 'village' ? '🌿 Village' : info.team === 'werewolf' ? '🐺 Werewolf' : '💀 Solo'}
                </p>
              </div>
              {multiRoles.includes(role) && !disabled ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => removeOne(role)}
                    disabled={roleCount === 0}
                    className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded w-6 h-6 flex items-center justify-center disabled:opacity-30 disabled:cursor-default"
                  >−</button>
                  <span className="text-moon-400 font-bold text-sm w-4 text-center">{roleCount || '0'}</span>
                  <button
                    onClick={() => addOne(role)}
                    className="text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded w-6 h-6 flex items-center justify-center"
                  >+</button>
                </div>
              ) : roleCount > 0 ? (
                <span className="text-moon-400 font-bold text-sm">×{roleCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className={`text-center text-sm font-semibold ${
        count === required ? 'text-green-400' : count > required ? 'text-red-400' : 'text-yellow-400'
      }`}>
        {count} / {required} roles selected
        {count === required && ' ✓'}
        {count > required && ` (${count - required} too many)`}
        {count < required && ` (need ${required - count} more)`}
      </div>
    </div>
  );
}
