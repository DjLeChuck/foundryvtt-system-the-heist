import * as HEIST from '../const.mjs';

export default function WithSettingsMixin(BaseApplication) {
  class WithSettings extends BaseApplication {
    _getSettings() {
      return game.settings.get(HEIST.SYSTEM_ID, this.options.settingsName).toJSON();
    }

    _getSetting(key, defaultValue = null) {
      const settings = this._getSettings();

      return settings[key] ?? defaultValue;
    }

    async _setSettings(settings) {
      await game.settings.set(HEIST.SYSTEM_ID, this.options.settingsName, foundry.utils.mergeObject(
        this._getSettings(),
        settings,
      ));
    }
  }

  return WithSettings;
}
