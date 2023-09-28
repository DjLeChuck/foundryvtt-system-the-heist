import * as HEIST from '../const.mjs';

export const GetSceneControlButtons = {
  listen() {
    Hooks.on('getSceneControlButtons', (controls) => {
      const heistTools = [{
        icon: 'fa-duotone fa-cards',
        name: 'heist-agenttest-tool',
        title: 'HEIST.AgentTestWindow.Title',
        button: true,
        onClick: () => game[HEIST.SYSTEM_ID].agentTestWindow.render(true),
      }];

      if (game.user.isGM || game.settings.get(HEIST.SYSTEM_ID, 'allowAgentsToSeeGamePhaseTimer')) {
        heistTools.push({
          icon: 'fa-duotone fa-hourglass-clock',
          name: 'heist-gamephase-tool',
          title: 'HEIST.GamePhaseWindow.Title',
          button: true,
          onClick: () => game[HEIST.SYSTEM_ID].gamePhaseWindow.render(true),
        });
      }

      controls.push({
        name: 'heist',
        title: 'HEIST.Global.TheHeist',
        layer: 'heist',
        icon: 'fa-solid fa-dove',
        tools: heistTools,
        visible: true,
      });
    });
  },
};
