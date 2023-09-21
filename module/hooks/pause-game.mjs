import * as HEIST from '../const.mjs';

export const PauseGame = {
  listen() {
    Hooks.on('pauseGame', (paused) => {
      if (game.settings.get(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft')) {
        game[HEIST.SYSTEM_ID].gamePhaseWindow.togglePause();
      }
    });
  },
};
