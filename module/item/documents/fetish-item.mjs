import { BaseItem } from './base-item.mjs';

export class FetishItem extends BaseItem {
  get isUsed() {
    return this.system.used;
  }

  async toggleUsage() {
    await this.update({ 'system.used': !this.system.used });
  }
}
