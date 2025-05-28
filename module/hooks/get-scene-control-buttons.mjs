import * as HEIST from '../const.mjs';

export const GetSceneControlButtons = {
  listen() {
    Hooks.on('getSceneControlButtons', (controls) => {
      controls.heist = {
        name: 'heist',
        title: 'HEIST.Global.TheHeist',
        icon: 'fa-solid fa-dove',
        tools: {
          agentTest: {
            icon: 'fa-duotone fa-cards',
            name: 'agentTest',
            title: 'HEIST.AgentTestWindow.Title',
            button: true,
            onChange: () => game[HEIST.SYSTEM_ID].agentTestWindow.render(true),
          },
          gamePhase: {
            icon: 'fa-duotone fa-hourglass-clock',
            name: 'gamePhase',
            title: 'HEIST.GamePhaseWindow.Title',
            button: true,
            onChange: () => game[HEIST.SYSTEM_ID].gamePhaseWindow.render(true),
            visible: game.user.isGM || game.settings.get(HEIST.SYSTEM_ID, 'allowAgentsToSeeGamePhaseTimer'),
          },
        },
      };
    });
  },
};
