export default class HeistCards extends foundry.documents.Cards {
  async _preDelete() {
    await this.recall({ chatNotification: false });
  }
}
