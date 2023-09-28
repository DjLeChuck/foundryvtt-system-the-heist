import { Load } from './load.mjs';
import { GetSceneControlButtons } from './get-scene-control-buttons.mjs';
import { Init } from './init.mjs';
import { Ready } from './ready.mjs';
import { Setup } from './setup.mjs';
import { PauseGame } from './pause-game.mjs';

export const HeistHooks = {
  listen() {
    const listeners = [
      Load,
      GetSceneControlButtons,
      Init,
      Ready,
      Setup,
      PauseGame,
    ];

    for (const Listener of listeners) {
      Listener.listen();
    }
  },
};
