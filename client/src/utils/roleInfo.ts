import { useLangStore } from '../store/langStore';
import type { RoleName, Team } from 'shared';

export interface RoleInfo {
  name: string;
  emoji: string;
  team: Team;
  description: string;
  nightAction: string;
  color: string;
}

export const ROLE_INFO: Record<RoleName, RoleInfo> = {
  werewolf: {
    name: 'Werewolf',
    emoji: '🐺',
    team: 'werewolf',
    description: 'You are a Werewolf! Work with your pack to avoid being eliminated.',
    nightAction: 'Open your eyes and look for your fellow Werewolves.',
    color: 'text-red-400',
  },
  minion: {
    name: 'Minion',
    emoji: '🦹',
    team: 'werewolf',
    description: 'You serve the Werewolves. Help them survive — even at the cost of your own life.',
    nightAction: 'Open your eyes and look for the Werewolves (they don\'t know who you are).',
    color: 'text-orange-400',
  },
  mason: {
    name: 'Mason',
    emoji: '🔨',
    team: 'village',
    description: 'You are a Mason. Find your fellow Masons and work together to identify Werewolves.',
    nightAction: 'Open your eyes and look for your fellow Masons.',
    color: 'text-blue-400',
  },
  seer: {
    name: 'Seer',
    emoji: '🔮',
    team: 'village',
    description: 'You can see through lies! Look at another player\'s card or two center cards.',
    nightAction: 'Look at one player\'s card OR two of the center cards.',
    color: 'text-purple-400',
  },
  robber: {
    name: 'Robber',
    emoji: '🗡️',
    team: 'village',
    description: 'Steal another player\'s role and see what you took.',
    nightAction: 'Exchange your card with another player\'s card, then view your new role.',
    color: 'text-yellow-400',
  },
  troublemaker: {
    name: 'Troublemaker',
    emoji: '😈',
    team: 'village',
    description: 'Swap two other players\' cards without looking at them.',
    nightAction: 'Exchange the cards of two other players (you don\'t see what they are).',
    color: 'text-pink-400',
  },
  drunk: {
    name: 'Drunk',
    emoji: '🍺',
    team: 'village',
    description: 'You\'re so drunk you swap your card with a center card — but you don\'t know what you got!',
    nightAction: 'Exchange your card with a center card (you won\'t see your new role).',
    color: 'text-amber-400',
  },
  insomniac: {
    name: 'Insomniac',
    emoji: '👁️',
    team: 'village',
    description: 'Can\'t sleep! You wake up last and see your final card.',
    nightAction: 'Look at your own card to see if it changed during the night.',
    color: 'text-cyan-400',
  },
  hunter: {
    name: 'Hunter',
    emoji: '🏹',
    team: 'village',
    description: 'If you are eliminated, whoever you voted for is also eliminated.',
    nightAction: 'No night action. Remember: your vote carries extra power!',
    color: 'text-green-400',
  },
  tanner: {
    name: 'Tanner',
    emoji: '💀',
    team: 'tanner',
    description: 'You WANT to die! Win by getting eliminated. You don\'t care about anyone else.',
    nightAction: 'No night action. Try to get yourself eliminated during the day!',
    color: 'text-gray-400',
  },
  villager: {
    name: 'Villager',
    emoji: '👨‍🌾',
    team: 'village',
    description: 'You\'re a simple villager. Help identify and eliminate the Werewolves!',
    nightAction: 'No night action. Try to stay awake and observe!',
    color: 'text-lime-400',
  },
};

export const ROLE_INFO_ZH: Record<RoleName, RoleInfo> = {
  werewolf: { name: '狼人', emoji: '🐺', team: 'werewolf', color: 'text-red-400',
    description: '你是狼人！和你的同伴合作，避免被淘汰。',
    nightAction: '睁开眼睛，寻找你的狼人同伴。' },
  minion: { name: '爪牙', emoji: '🦹', team: 'werewolf', color: 'text-orange-400',
    description: '你为狼人服务。帮助他们存活——即使以自己的生命为代价。',
    nightAction: '睁开眼睛，寻找狼人（他们不知道你是谁）。' },
  mason: { name: '共济会员', emoji: '🔨', team: 'village', color: 'text-blue-400',
    description: '你是共济会员。找到你的同伴，一起识破狼人。',
    nightAction: '睁开眼睛，寻找你的共济会同伴。' },
  seer: { name: '预言家', emoji: '🔮', team: 'village', color: 'text-purple-400',
    description: '你能看穿谎言！查看另一位玩家的牌或两张中央牌。',
    nightAction: '查看一名玩家的牌，或两张中央牌。' },
  robber: { name: '强盗', emoji: '🗡️', team: 'village', color: 'text-yellow-400',
    description: '偷取另一位玩家的角色并查看你得到了什么。',
    nightAction: '把自己的牌和另一名玩家的牌交换，然后查看你的新角色。' },
  troublemaker: { name: '捣蛋鬼', emoji: '😈', team: 'village', color: 'text-pink-400',
    description: '交换其他两名玩家的牌，但不查看内容。',
    nightAction: '交换其他两名玩家的牌（你不会看到是什么）。' },
  drunk: { name: '酒鬼', emoji: '🍺', team: 'village', color: 'text-amber-400',
    description: '你醉到把自己的牌和中央牌交换——但你不知道换了什么！',
    nightAction: '把你的牌和一张中央牌交换（你不会看到新角色）。' },
  insomniac: { name: '失眠者', emoji: '👁️', team: 'village', color: 'text-cyan-400',
    description: '睡不着！你最后醒来，查看自己的最终牌。',
    nightAction: '查看自己的牌，看看夜晚期间是否发生了变化。' },
  hunter: { name: '猎人', emoji: '🏹', team: 'village', color: 'text-green-400',
    description: '如果你被淘汰，你投票的玩家也会被淘汰。',
    nightAction: '无夜晚行动。记住：你的投票有额外的威力！' },
  tanner: { name: '皮匠', emoji: '💀', team: 'tanner', color: 'text-gray-400',
    description: '你想被淘汰！被淘汰就获胜。你不关心其他任何人。',
    nightAction: '无夜晚行动。在白天尽量让自己被淘汰！' },
  villager: { name: '村民', emoji: '👨‍🌾', team: 'village', color: 'text-lime-400',
    description: '你是普通村民。帮助找出并淘汰狼人！',
    nightAction: '无夜晚行动。尽量保持清醒并观察！' },
};

/** Returns language-appropriate role info. Use this in components instead of ROLE_INFO directly. */
export function useRoleInfo(): Record<RoleName, RoleInfo> {
  const lang = useLangStore(s => s.lang);
  return lang === 'zh' ? ROLE_INFO_ZH : ROLE_INFO;
}

export const ALL_ROLES: RoleName[] = [
  'werewolf', 'minion', 'mason', 'seer', 'robber',
  'troublemaker', 'drunk', 'insomniac', 'hunter', 'tanner', 'villager',
];

export function teamColor(team: Team): string {
  switch (team) {
    case 'village': return 'text-green-400';
    case 'werewolf': return 'text-red-400';
    case 'tanner': return 'text-gray-400';
  }
}

export function teamLabel(team: Team): string {
  switch (team) {
    case 'village': return 'Village';
    case 'werewolf': return 'Werewolf';
    case 'tanner': return 'Tanner';
  }
}
