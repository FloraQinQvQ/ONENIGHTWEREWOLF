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

export function narrateNightResult(result: NightActionResult): string {
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

export function narrateResult(results: GameResults, currentUserId: string): string {
  const isWinner = results.winners.includes(currentUserId);
  const teamName =
    results.winTeam === 'village' ? 'Village' :
    results.winTeam === 'werewolf' ? 'Werewolf' : 'Tanner';
  const outcome = isWinner ? 'You are victorious!' : 'Better luck next time.';
  return `Game over. The ${teamName} team wins. ${results.reason} ${outcome}`;
}
