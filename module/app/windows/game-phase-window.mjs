import * as HEIST from '../../const.mjs';
import { WithSettingsWindow } from './with-settings-window.mjs';

export class GamePhaseWindow extends WithSettingsWindow {
  constructor(options = {}) {
    super(options);

    this.phases = this.#loadPhases();
    this.paused = this.#getPausedStatus();

    this.#setTimeLeft();

    if (this.paused) {
      this.#stopTimeLeftInterval();
    } else {
      this.#startTimeLeftInterval();
    }
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'game-phase-window'],
      title: game.i18n.localize('HEIST.GamePhaseWindow.Title'),
      width: GamePhaseWindow.#width(),
      height: GamePhaseWindow.#height(),
      settingsName: 'gamePhase',
      resizable: true,
    });
  }

  /** @override */
  get template() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window-small.html.hbs`;
    }

    return `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window.html.hbs`;
  }

  get #currentPhaseIndex() {
    return this._getSetting('current');
  }

  get currentPhase() {
    return this.#getCurrentPhase();
  }

  getData() {
    const timeLeft = this._getSetting('timeLeft');

    return {
      timeLeft,
      isGM: game.user.isGM,
      phases: this.phases,
      currentPhase: this.#getCurrentPhase(),
      paused: this.#getPausedStatus(),
      active: 0 < timeLeft,
      canPause: !game.settings.get(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft'),
      hasNextPhase: undefined !== this.phases[this.#currentPhaseIndex + 1],
    };
  }

  activateListeners(html) {
    if (!game.user.isGM) {
      return;
    }

    html.on('click', '[data-pause]', this.#onTogglePause.bind(this));
    html.on('click', '[data-next]', this.#onNextPhase.bind(this));
    html.on('click', '[data-reset]', this.#onReset.bind(this));
  }

  render(force = false, options = {}) {
    if (!game.user.isGM && !game.settings.get(HEIST.SYSTEM_ID, 'allowAgentsToSeeGamePhaseTimer')) {
      return this;
    }

    return super.render(force, options);
  }

  async setPauseState(paused) {
    if (!game.user.isGM) {
      return;
    }

    this.paused = paused;

    await this._setSettings({ paused });

    this.#updateTimeLeftInterval();
  }

  async togglePause() {
    if (!game.user.isGM) {
      return;
    }

    this.paused = !this.paused;

    await this._setSettings({ paused: this.paused });

    this.#updateTimeLeftInterval();

    this.#render();
  }

  static #width() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return 440;
    }

    return 800;
  }

  static #height() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return 230;
    }

    return 310;
  }

  async #onTogglePause(e) {
    e.preventDefault();

    await this.togglePause();
  }

  #loadPhases() {
    const phases = {};

    for (const phase of HEIST.GAME_PHASES) {
      phases[phase.number] = {
        ...phase,
        duration: game.settings.get(HEIST.SYSTEM_ID, `phase${phase.number}Duration`) ?? phase.defaultDuration,
      };
    }

    return phases;
  }

  async #onNextPhase(e) {
    e.preventDefault();

    await Dialog.confirm({
      title: game.i18n.format('HEIST.GamePhaseWindow.Buttons.NextPhase'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamePhaseWindow.NextPhaseValidation.Message')}</p>`,
      yes: this.#changePhase.bind(this, this.#currentPhaseIndex + 1),
    });
  }

  async #onReset(e) {
    e.preventDefault();

    await Dialog.confirm({
      title: game.i18n.format('HEIST.GamePhaseWindow.Buttons.Reset'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamePhaseWindow.ResetPhaseValidation.Message')}</p>`,
      yes: this.#changePhase.bind(this, 0),
    });
  }

  async #changePhase(phase) {
    if (undefined === this.phases[phase]) {
      ui.notifications.error(`Invalid phase ${phase}!`);

      return;
    }

    this.#stopTimeLeftInterval();

    await this._setSettings({ current: phase });

    this.#setTimeLeft(true);
    await this._setSettings({ timeLeft: this.timeLeft });

    if (!this.paused) {
      this.#startTimeLeftInterval();
    }

    Hooks.callAll(`${HEIST.SYSTEM_ID}.changeGamePhase`, this.currentPhase);

    this.#render();
  }

  #setTimeLeft(isPhaseChanging) {
    const currentPhase = this.#getCurrentPhase();

    if (currentPhase) {
      if (isPhaseChanging) {
        this.timeLeft = this.phases[this.#currentPhaseIndex].duration * 60;
      } else {
        this.timeLeft = this._getSetting('timeLeft', this.phases[this.#currentPhaseIndex].duration * 60);
      }
    } else {
      this.timeLeft = 0;
    }
  }

  #startTimeLeftInterval() {
    this.interval = setInterval(async () => {
      this.timeLeft -= 1;

      if (game.user.isGM) {
        await this._setSettings({ timeLeft: this.timeLeft });
      }

      if (this.timeLeft < 0) {
        this.#stopTimeLeftInterval();
      }

      this.render(false);
    }, 1000);
  }

  #stopTimeLeftInterval() {
    if (this.interval) {
      clearInterval(this.interval);

      this.interval = null;
    }
  }

  #updateTimeLeftInterval() {
    if (this.paused) {
      this.#stopTimeLeftInterval();
    } else {
      this.#startTimeLeftInterval();
    }
  }

  #getPausedStatus() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft')) {
      return game.paused;
    }

    return this._getSetting('paused', false);
  }

  #getCurrentPhase() {
    return this.phases[this.#currentPhaseIndex] ?? null;
  }

  #render() {
    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.REFRESH_GAME_PHASE_WINDOW });

    this.render();
  }
}
