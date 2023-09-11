import * as HEIST from './const.mjs';

export class SocketListener {
  static activate() {
    game.socket.on(`system.${HEIST.SYSTEM_ID}`, ({ request, data }) => {
      switch (request) {
        case 'drawCard':
          game[HEIST.SYSTEM_ID].cardWindow.setCard(data.card);
          break;
        default:
          throw new Error(`Unknown socket request ${request}`);
      }
    });
  }
}
