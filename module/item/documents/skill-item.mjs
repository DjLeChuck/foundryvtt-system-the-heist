import { BaseItem } from './base-item.mjs';

export class SkillItem extends BaseItem {
  /**
   * @return {boolean}
   */
  get isLocked() {
    return this.system.locked;
  }

  async toggleLock() {
    await this.update({ 'system.locked': !this.system.locked });
  }
}
