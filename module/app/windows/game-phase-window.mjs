import * as HEIST from '../../const.mjs';

export class GamePhaseWindow extends Application {
  constructor(options = {}) {
    super(options);

    this.currentPhase = game.settings.get(HEIST.SYSTEM_ID, 'currentPhase');
    this.phases = this.#loadPhases();
    this.paused = true;
    this.interval = null;

    this.#setTimeLeft();
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'game-phase-window'],
      template: `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window.html.hbs`,
      title: game.i18n.localize('HEIST.GamePhaseWindow.Title'),
      width: 600,
      height: 320,
    });
  }

  getData() {
    return {
      isGM: game.user.isGM,
      phases: this.phases,
      currentPhase: this.phases[this.currentPhase],
      timeLeft: this.timeLeft,
      paused: this.paused,
      active: 0 < this.timeLeft,
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

  togglePause() {
    if (this.paused) {
      this.paused = false;
      this.#startTimeLeftUpdate();
    } else {
      this.paused = true;
      this.#stopTimeLeftUpdate();
    }

    this.render();
  }

  #onTogglePause(e) {
    e.preventDefault();

    this.togglePause();
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

  #onNextPhase(e) {
    e.preventDefault();

    this.#changePhase(this.currentPhase + 1);
  }

  #onReset(e) {
    e.preventDefault();

    this.#changePhase(1);
  }

  #changePhase(phase) {
    if (undefined === this.phases[phase]) {
      ui.notifications.error(`Invalid phase ${phase}!`);

      return;
    }

    this.#stopTimeLeftUpdate();
    this.paused = true;
    this.currentPhase = phase;
    game.settings.set(HEIST.SYSTEM_ID, 'currentPhase', this.currentPhase);
    this.#setTimeLeft();

    this.render();
  }

  #setTimeLeft() {
    this.timeLeft = this.phases[this.currentPhase].duration * 60;
    // game.settings.set(HEIST.SYSTEM_ID, 'currentPhase', this.timeLeft);
  }

  #startTimeLeftUpdate() {
    this.interval = setInterval(() => {
      this.timeLeft -= 1;

      if (this.timeLeft < 0) {
        this.#stopTimeLeftUpdate();
      }

      this.render(false);
    }, 1000);
  }

  #stopTimeLeftUpdate() {
    if (this.interval) {
      clearInterval(this.interval);

      this.interval = null;
    }
  }
}
