import * as HEIST from './const.mjs';

export class SocketListener {
  static activate() {
    game.socket.on(`system.${HEIST.SYSTEM_ID}`, ({ request, data }) => {
      switch (request) {
        case HEIST.SOCKET_REQUESTS.REFRESH_GAME_PHASE_WINDOW:
          game[HEIST.SYSTEM_ID].gamePhaseWindow.render(false);
          break;
        default:
          throw new Error(`Unknown socket request ${request}`);
      }
    });
  }
}
