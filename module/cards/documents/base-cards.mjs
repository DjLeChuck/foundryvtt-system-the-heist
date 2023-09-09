/**
 * Extend the base Cards document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Cards}
 */
export class BaseCards extends Cards {
  /**
   * Disable chat notification on deletion.
   *
   * @inheritDoc
   */
  async _preDelete(options, user) {
    await this.recall({ chatNotification: false });
  }
}
