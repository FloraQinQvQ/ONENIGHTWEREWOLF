import type { RoleName, NightActionResult, GameResults } from 'shared';

// Called for the active player when it's their turn
export const ROLE_WAKE_SCRIPT: Record<RoleName, string> = {
  werewolf: "Werewolves, open your eyes. Look for other werewolves.",
  minion: "Minion, open your eyes. Look for the Werewolves — they don't know who you are.",
  mason: "Masons, open your eyes. Look for your fellow Masons.",
  seer: "Seer, open your eyes. You may look at one player's card, or two center cards.",
  robber: "Robber, open your eyes. You may steal another player's card and see your new role.",
  troublemaker: "Troublemaker, open your eyes. You may swap two other players' cards.",
  drunk: "Drunk, open your eyes. You must swap your card with a center card. You won't see your new role.",
  insomniac: "Insomniac, open your eyes. Check if your card has changed during the night.",
  hunter: "Hunter — you have no night action. Go back to sleep.",
  tanner: "Tanner — you have no night action. Go back to sleep.",
  villager: "Villager — you have no night action. Go back to sleep.",
};

export const ROLE_WAKE_SCRIPT_ZH: Record<RoleName, string> = {
  werewolf: "狼人，睁开眼睛，寻找你们的同伴。",
  minion: "爪牙，睁开眼睛，寻找狼人——他们不知道你是谁。",
  mason: "共济会员，睁开眼睛，寻找你们的同伴。",
  seer: "预言家，睁开眼睛，你可以查看一名玩家的牌，或两张中央牌。",
  robber: "强盗，睁开眼睛，你可以偷取另一名玩家的牌并查看你的新角色。",
  troublemaker: "捣蛋鬼，睁开眼睛，你可以交换其他两名玩家的牌。",
  drunk: "酒鬼，睁开眼睛，你必须把你的牌和一张中央牌交换，你不会看到新角色。",
  insomniac: "失眠者，睁开眼睛，查看你的牌在夜晚是否发生了变化。",
  hunter: "猎人——你没有夜晚行动，请继续睡觉。",
  tanner: "皮匠——你没有夜晚行动，请继续睡觉。",
  villager: "村民——你没有夜晚行动，请继续睡觉。",
};

// Brief call for non-active players watching the night progress
export const ROLE_WAIT_SCRIPT: Record<RoleName, string> = {
  werewolf: "Werewolves, open your eyes.",
  minion: "Minion, open your eyes.",
  mason: "Masons, open your eyes.",
  seer: "Seer, open your eyes.",
  robber: "Robber, open your eyes.",
  troublemaker: "Troublemaker, open your eyes.",
  drunk: "Drunk, open your eyes.",
  insomniac: "Insomniac, open your eyes.",
  hunter: "",
  tanner: "",
  villager: "",
};

export const ROLE_WAIT_SCRIPT_ZH: Record<RoleName, string> = {
  werewolf: "狼人，睁开眼睛。",
  minion: "爪牙，睁开眼睛。",
  mason: "共济会员，睁开眼睛。",
  seer: "预言家，睁开眼睛。",
  robber: "强盗，睁开眼睛。",
  troublemaker: "捣蛋鬼，睁开眼睛。",
  drunk: "酒鬼，睁开眼睛。",
  insomniac: "失眠者，睁开眼睛。",
  hunter: "",
  tanner: "",
  villager: "",
};

export function narrateNightResult(result: NightActionResult, lang = 'en'): string {
  if (lang === 'zh') return narrateNightResultZh(result);

  switch (result.role) {
    case 'werewolf':
      if (result.werewolves && result.werewolves.length > 1) {
        const names = result.werewolves.map(w => w.displayName).join(' and ');
        return `Your fellow werewolves are ${names}. Close your eyes.`;
      }
      if (result.centerCards && result.centerCards.length > 0) {
        return `You are the lone wolf. The center card is the ${result.centerCards[0].role}. Close your eyes.`;
      }
      return "You are the lone wolf. Close your eyes.";

    case 'minion':
      if (result.werewolves && result.werewolves.length > 0) {
        const names = result.werewolves.map(w => w.displayName).join(' and ');
        return `The werewolves are ${names}. Close your eyes.`;
      }
      return "There are no werewolves in play. You're on your own! Close your eyes.";

    case 'mason':
      if (result.masons && result.masons.length > 1) {
        const others = result.masons.filter(m => m.displayName);
        const names = others.map(m => m.displayName).join(' and ');
        return `Your fellow mason is ${names}. Close your eyes.`;
      }
      return "You are the lone mason. Close your eyes.";

    case 'seer':
      if (result.revealedTarget && result.revealedRole) {
        return `${result.revealedTarget}'s role is the ${result.revealedRole}. Close your eyes.`;
      }
      if (result.centerCards && result.centerCards.length >= 2) {
        return `The two center cards are ${result.centerCards[0].role} and ${result.centerCards[1].role}. Close your eyes.`;
      }
      return "You chose not to look. Close your eyes.";

    case 'robber':
      if (result.stolenFrom && result.newRole) {
        return `You stole ${result.stolenFrom}'s card. You are now the ${result.newRole}. Close your eyes.`;
      }
      return "You chose not to steal. Close your eyes.";

    case 'troublemaker':
      return "You have swapped the cards. Close your eyes.";

    case 'drunk':
      return "You have swapped your card with a center card. Sweet dreams. Close your eyes.";

    case 'insomniac':
      if (result.currentRole && result.currentRole !== 'insomniac') {
        return `Your card has changed. You are now the ${result.currentRole}. Close your eyes.`;
      }
      return "Your card has not changed. You are still the Insomniac. Close your eyes.";

    default:
      return "Close your eyes.";
  }
}

function narrateNightResultZh(result: NightActionResult): string {
  switch (result.role) {
    case 'werewolf':
      if (result.werewolves && result.werewolves.length > 1) {
        const names = result.werewolves.map(w => w.displayName).join('和');
        return `你的狼人同伴是${names}。闭上眼睛。`;
      }
      if (result.centerCards && result.centerCards.length > 0) {
        return `你是孤独的狼人。中央牌是${result.centerCards[0].role}。闭上眼睛。`;
      }
      return "你是孤独的狼人。闭上眼睛。";
    case 'minion':
      if (result.werewolves && result.werewolves.length > 0) {
        const names = result.werewolves.map(w => w.displayName).join('和');
        return `狼人是${names}。闭上眼睛。`;
      }
      return "游戏中没有狼人。你只能靠自己！闭上眼睛。";
    case 'mason':
      if (result.masons && result.masons.length > 1) {
        const names = result.masons.map(m => m.displayName).join('和');
        return `你的共济会同伴是${names}。闭上眼睛。`;
      }
      return "你是唯一的共济会员。闭上眼睛。";
    case 'seer':
      if (result.revealedTarget && result.revealedRole) {
        return `${result.revealedTarget}的角色是${result.revealedRole}。闭上眼睛。`;
      }
      if (result.centerCards && result.centerCards.length >= 2) {
        return `两张中央牌是${result.centerCards[0].role}和${result.centerCards[1].role}。闭上眼睛。`;
      }
      return "你选择不查看。闭上眼睛。";
    case 'robber':
      if (result.stolenFrom && result.newRole) {
        return `你偷走了${result.stolenFrom}的牌。你现在是${result.newRole}。闭上眼睛。`;
      }
      return "你选择不偷取。闭上眼睛。";
    case 'troublemaker':
      return "你已经交换了两张牌。闭上眼睛。";
    case 'drunk':
      return "你已经把你的牌和中央牌交换了。好好做梦。闭上眼睛。";
    case 'insomniac':
      if (result.currentRole && result.currentRole !== 'insomniac') {
        return `你的牌变了。你现在是${result.currentRole}。闭上眼睛。`;
      }
      return "你的牌没有变化。你仍然是失眠者。闭上眼睛。";
    default:
      return "闭上眼睛。";
  }
}

export function narrateResult(results: GameResults, currentUserId: string, lang = 'en'): string {
  const isWinner = results.winners.includes(currentUserId);
  if (lang === 'zh') {
    const teamName =
      results.winTeam === 'village' ? '村民' :
      results.winTeam === 'werewolf' ? '狼人' : '皮匠';
    const outcome = isWinner ? '你获胜了！' : '再接再厉。';
    return `游戏结束。${teamName}阵营获胜。${outcome}`;
  }
  const teamName =
    results.winTeam === 'village' ? 'Village' :
    results.winTeam === 'werewolf' ? 'Werewolf' : 'Tanner';
  const outcome = isWinner ? 'You are victorious!' : 'Better luck next time.';
  return `Game over. The ${teamName} team wins. ${results.reason} ${outcome}`;
}
