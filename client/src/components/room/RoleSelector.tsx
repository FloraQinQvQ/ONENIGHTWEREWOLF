import { useState } from 'react';
import type { RoleName } from 'shared';
import { ALL_ROLES, useRoleInfo } from '../../utils/roleInfo';
import { useT } from '../../i18n';
import { useLangStore } from '../../store/langStore';

interface Props {
  selected: RoleName[];
  onChange: (roles: RoleName[]) => void;
  required: number;
  disabled: boolean;
}

export default function RoleSelector({ selected, onChange, required, disabled }: Props) {
  const roleInfo = useRoleInfo();
  const t = useT();
  const lang = useLangStore(s => s.lang);
  const [expandedRole, setExpandedRole] = useState<RoleName | null>(null);
  const count = selected.length;

  const stackableRoles: RoleName[] = ['werewolf', 'mason', 'villager'];

  const counts: Record<string, number> = {};
  for (const r of selected) counts[r] = (counts[r] ?? 0) + 1;

  const addOne = (role: RoleName) => {
    if (disabled) return;
    const max = stackableRoles.includes(role) ? Infinity : 1;
    if ((counts[role] ?? 0) >= max) return;
    onChange([...selected, role]);
  };

  const removeOne = (role: RoleName) => {
    if (disabled) return;
    const lastIdx = selected.lastIndexOf(role);
    if (lastIdx !== -1) {
      onChange([...selected.slice(0, lastIdx), ...selected.slice(lastIdx + 1)]);
    }
  };

  const teamLabel = (team: string) => {
    if (lang === 'zh') {
      return team === 'village' ? '🌿 村民阵营' : team === 'werewolf' ? '🐺 狼人阵营' : '💀 独立阵营';
    }
    return team === 'village' ? '🌿 Village' : team === 'werewolf' ? '🐺 Werewolf' : '💀 Solo';
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {ALL_ROLES.map(role => {
          const info = roleInfo[role];
          const roleCount = counts[role] ?? 0;
          const isSelected = roleCount > 0;
          const isExpanded = expandedRole === role;
          return (
            <div
              key={role}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? 'border-moon-500/60 bg-moon-500/10'
                  : 'border-white/10 bg-night-700'
              }`}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="text-xl flex-shrink-0">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? info.color : 'text-gray-300'}`}>
                    {info.name}
                  </p>
                  <p className="text-xs text-gray-500">{teamLabel(info.team)}</p>
                </div>
                {/* Info toggle */}
                <button
                  onClick={() => setExpandedRole(isExpanded ? null : role)}
                  className="text-gray-600 hover:text-gray-300 transition-colors text-sm flex-shrink-0 w-5 text-center"
                  title={isExpanded ? 'Hide description' : 'Show description'}
                >
                  {isExpanded ? '▲' : 'ℹ'}
                </button>
                {!disabled && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => removeOne(role)}
                      disabled={roleCount === 0}
                      className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded w-7 h-7 flex items-center justify-center disabled:opacity-30 disabled:cursor-default text-base"
                    >−</button>
                    <span className={`font-bold text-sm w-5 text-center ${roleCount > 0 ? 'text-moon-400' : 'text-gray-600'}`}>
                      {roleCount}
                    </span>
                    <button
                      onClick={() => addOne(role)}
                      disabled={!stackableRoles.includes(role) && roleCount >= 1}
                      className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded w-7 h-7 flex items-center justify-center text-base disabled:opacity-30 disabled:cursor-default"
                    >+</button>
                  </div>
                )}
                {disabled && roleCount > 0 && (
                  <span className="text-moon-400 font-bold text-sm flex-shrink-0">×{roleCount}</span>
                )}
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/5 pt-2">
                  <p className="text-xs text-gray-400 leading-snug">{info.description}</p>
                  <p className="text-xs text-gray-600 leading-snug mt-1 italic">{info.nightAction}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`text-center text-sm font-semibold ${
        count === required ? 'text-green-400' : count > required ? 'text-red-400' : 'text-yellow-400'
      }`}>
        {lang === 'zh'
          ? `已选 ${count} / ${required} 个角色${count === required ? ' ✓' : count > required ? ` （多了 ${count - required} 个）` : ` （还需 ${required - count} 个）`}`
          : `${count} / ${required} roles selected${count === required ? ' ✓' : count > required ? ` (${count - required} too many)` : ` (need ${required - count} more)`}`
        }
      </div>
    </div>
  );
}
