import * as HEIST from '../../const.mjs';
import WithSettingsMixin from '../../helpers/with-settings-mixin.mjs';

const { api } = foundry.applications;

export class GamePhaseWindow extends WithSettingsMixin(api.HandlebarsApplicationMixin(api.ApplicationV2)) {
  constructor(options = {}) {
    options.position = {
      width: GamePhaseWindow.#width(),
      height: GamePhaseWindow.#height(),
    };

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

  static DEFAULT_OPTIONS = {
    classes: [HEIST.SYSTEM_ID, 'game-phase-window'],
    window: {
      title: 'HEIST.GamePhaseWindow.Title',
      resizable: true,
    },
    actions: {
      nextPhase: this.#onNextPhase,
      togglePause: this.#onTogglePause,
      reset: this.#onReset,
    },
    settingsName: 'gamePhase',
  };

  static PARTS = {
    main: {
      template: undefined,
    },
  };

  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    parts.main.template = GamePhaseWindow.#template();

    return parts;
  }

  /** @override */
  async _prepareContext(options) {
    const timeLeft = this._getSetting('timeLeft');

    return Object.assign({}, await super._prepareContext(options), {
      timeLeft,
      isGM: game.user.isGM,
      phases: this.phases,
      currentPhase: this.#getCurrentPhase(),
      paused: this.#getPausedStatus(),
      active: 0 < timeLeft,
      canPause: !game.settings.get(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft'),
      hasNextPhase: null !== this.#nextPhase,
    });
  }

  get currentPhase() {
    return this.#getCurrentPhase();
  }

  get isPaused() {
    return this.paused;
  }

  get #currentPhaseIndex() {
    return this._getSetting('current');
  }

  get #nextPhase() {
    const phase = this.phases[this.#currentPhaseIndex + 1];

    return undefined === phase ? null : phase;
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

    Hooks.callAll(`${HEIST.SYSTEM_ID}.changeGamePhasePause`, this.isPaused);
  }

  async togglePause() {
    if (!game.user.isGM) {
      return;
    }

    this.paused = !this.paused;

    await this._setSettings({ paused: this.paused });

    this.#updateTimeLeftInterval();

    Hooks.callAll(`${HEIST.SYSTEM_ID}.changeGamePhasePause`, this.isPaused);

    this.#render();
  }

  async activePreparationPhase() {
    await this.#changePhase(3);
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

    return 300;
  }

  static #template() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window-small.html.hbs`;
    }

    return `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window.html.hbs`;
  }

  static async #onTogglePause() {
    await this.togglePause();
  }

  static async #onNextPhase() {
    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.GamePhaseWindow.Buttons.NextPhase') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamePhaseWindow.NextPhaseValidation.Message')}</p>`,
      yes: {
        callback: async () => await this.#changePhase(this.#currentPhaseIndex + 1),
      },
    });
  }

  static async #onReset() {
    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.GamePhaseWindow.Buttons.Reset') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamePhaseWindow.ResetPhaseValidation.Message')}</p>`,
      yes: {
        callback: async () => await this.#changePhase(0),
      },
    });
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
