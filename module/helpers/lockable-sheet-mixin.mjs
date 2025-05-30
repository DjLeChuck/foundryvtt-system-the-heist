export default function LockableSheetMixin(BaseSheet) {
  class LockableSheet extends BaseSheet {
    #isLocked = true;

    static DEFAULT_OPTIONS = {
      actions: {
        toggleLock: LockableSheet.#onToggleLock,
      },
    };

    async _prepareContext(options) {
      return Object.assign({}, await super._prepareContext(options), {
        isLocked: this.#isLocked,
      });
    }

    unlock() {
      this.#isLocked = false;
    }

    static #onToggleLock() {
      this.#isLocked = !this.#isLocked;

      this.render();
    }
  }

  return LockableSheet;
}
