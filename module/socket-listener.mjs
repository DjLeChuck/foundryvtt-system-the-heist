export class SocketListener {
  static activate() {
    game.socket.on('system.the-heist', ({ request, data }) => {
      switch (request) {
        case 'drawCard':
          game.heist.cardWindow.setCard(data.card);
          break;
        default:
          throw new Error(`Unknown socket request ${request}`);
      }
    });
  }
}
