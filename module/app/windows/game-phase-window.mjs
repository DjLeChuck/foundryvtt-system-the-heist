import * as HEIST from '../../const.mjs';

export class GamePhaseWindow extends Application {
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
    });
  }

  get currentPhase() {
    return game.settings.get(HEIST.SYSTEM_ID, 'currentPhase');
  }

  /** @override */
  get template() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window-small.html.hbs`;
    }

    return `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window.html.hbs`;
  }

  getData() {
    const timeLeft = game.settings.get(HEIST.SYSTEM_ID, 'currentPhaseTimeLeft');

    return {
      timeLeft,
      isGM: game.user.isGM,
      phases: this.phases,
      currentPhase: this.phases[this.currentPhase],
      paused: this.#getPausedStatus(),
      active: 0 < timeLeft,
      canPause: !game.settings.get(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft'),
      hasNextPhase: undefined !== this.phases[this.currentPhase + 1],
    };
  }

  activateListeners(html) {
    if (!game.user.isGM) {
      return;
    }

    html.find('[data-pause]').click(this.#onTogglePause.bind(this));
    html.find('[data-next]').click(this.#onNextPhase.bind(this));
    html.find('[data-reset]').click(this.#onReset.bind(this));
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

    await game.settings.set(HEIST.SYSTEM_ID, 'currentPhasePaused', this.paused);

    this.#updateTimeLeftInterval();
  }

  async togglePause() {
    if (!game.user.isGM) {
      return;
    }

    this.paused = !this.paused;

    await game.settings.set(HEIST.SYSTEM_ID, 'currentPhasePaused', this.paused);

    this.#updateTimeLeftInterval();

    this.#render();
  }

  static #width() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return 400;
    }

    return 600;
  }

  static #height() {
    if (game.settings.get(HEIST.SYSTEM_ID, 'smallGamePhaseWindow')) {
      return 175;
    }

    return 320;
  }

  async #onTogglePause(e) {
    e.preventDefault();

    await this.togglePause();
  }

  #loadPhases() {
    const phases = {};

    for (const phase of HEIST.GAME_PHASES) {
      phases[phase.number] = {
        name: phase.name,
        duration: game.settings.get(HEIST.SYSTEM_ID, `phase${phase.number}Duration`),
      };
    }

    return phases;
  }

  async #onNextPhase(e) {
    e.preventDefault();

    await this.#changePhase(this.currentPhase + 1);
  }

  async #onReset(e) {
    e.preventDefault();

    await this.#changePhase(1);
  }

  async #changePhase(phase) {
    if (undefined === this.phases[phase]) {
      ui.notifications.error(`Invalid phase ${phase}!`);

      return;
    }

    this.#stopTimeLeftInterval();

    await game.settings.set(HEIST.SYSTEM_ID, 'currentPhase', phase);

    this.#setTimeLeft();
    await game.settings.set(HEIST.SYSTEM_ID, 'currentPhaseTimeLeft', this.timeLeft);

    if (!this.paused) {
      this.#startTimeLeftInterval();
    }

    this.#render();
  }

  #setTimeLeft() {
    this.timeLeft = this.phases[this.currentPhase].duration * 60;
  }

  #startTimeLeftInterval() {
    this.interval = setInterval(async () => {
      this.timeLeft -= 1;

      if (game.user.isGM) {
        await game.settings.set(HEIST.SYSTEM_ID, 'currentPhaseTimeLeft', this.timeLeft);
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

    return game.settings.get(HEIST.SYSTEM_ID, 'currentPhasePaused');
  }

  #render() {
    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.REFRESH_GAME_PHASE_WINDOW });

    this.render();
  }
}
