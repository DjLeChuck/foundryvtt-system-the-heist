import * as HEIST from './const.mjs';

export class SocketListener {
  static activate() {
    game.socket.on(`system.${HEIST.SYSTEM_ID}`, async ({ request }) => {
      switch (request) {
        case HEIST.SOCKET_REQUESTS.REFRESH_GAME_PHASE_WINDOW:
          game[HEIST.SYSTEM_ID].gamePhaseWindow.render(false);
          break;
        case HEIST.SOCKET_REQUESTS.REFRESH_AGENT_TEST_WINDOW:
          game[HEIST.SYSTEM_ID].agentTestWindow.render(false);
          break;
        case HEIST.SOCKET_REQUESTS.SHOW_AGENT_TEST_WINDOW:
          game[HEIST.SYSTEM_ID].agentTestWindow.render(true);
          break;
        case HEIST.SOCKET_REQUESTS.CLOSE_AGENT_TEST_WINDOW:
          await game[HEIST.SYSTEM_ID].agentTestWindow.close();
          break;
        case HEIST.SOCKET_REQUESTS.HANDLE_AGENT_TEST_BLACKJACK:
          await game[HEIST.SYSTEM_ID].agentTestWindow.handleAgentBlackjack();
          break;
        case HEIST.SOCKET_REQUESTS.FINISH_AGENT_TEST_WITH_SUCCESS:
          await game[HEIST.SYSTEM_ID].agentTestWindow.finishAgentTestWithSuccess();
          break;
        default:
          throw new Error(`Unknown socket request ${request}`);
      }
    });
  }
}
