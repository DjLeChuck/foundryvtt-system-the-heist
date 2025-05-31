export default class HeistActor extends foundry.documents.Actor {
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);

    if (this.system._onCreate instanceof Function) {
      await this.system._onCreate(data, options, userId);
    }
  }

  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);

    if (this.system._onUpdate instanceof Function) {
      await this.system._onUpdate(data, options, userId);
    }
  }

  async _onDelete(options, userId) {
    if (this.system._onDelete instanceof Function) {
      await this.system._onDelete(options, userId);
    }

    super._onDelete(options, userId);
  }
}
