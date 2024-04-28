import * as HEIST from '../../const.mjs';

export class WithSettingsWindow extends Application {
  _getSettings() {
    return game.settings.get(HEIST.SYSTEM_ID, this.options.settingsName).toJSON();
  }

  _getSetting(key, defaultValue = null) {
    const settings = this._getSettings();

    return settings[key] ?? defaultValue;
  }

  async _setSettings(settings) {
    if (!game.user.isGM) {
      game.socket.emit(`system.${HEIST.SYSTEM_ID}`, {
        request: HEIST.SOCKET_REQUESTS.GM_HANDLE_SET_SETTINGS,
        name: this.options.settingsName,
        settings: foundry.utils.mergeObject(
          this._getSettings(),
          settings,
        ),
      });
    } else {
      await game.settings.set(HEIST.SYSTEM_ID, this.options.settingsName, foundry.utils.mergeObject(
        this._getSettings(),
        settings,
      ));
    }
  }
}
