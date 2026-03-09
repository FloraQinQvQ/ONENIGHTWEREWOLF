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
