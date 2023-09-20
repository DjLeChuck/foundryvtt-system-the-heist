import * as HEIST from '../../const.mjs';

export class GamePhaseWindow extends Application {
  constructor(options = {}) {
    super(options);

    this.currentPhase = game.settings.get(HEIST.SYSTEM_ID, 'currentPhase');
    this.phases = [
      { name: 'HEIST.GamePhases.Phase1.Title', duration: 10 },
      { name: 'HEIST.GamePhases.Phase2.Title', duration: 10 },
      { name: 'HEIST.GamePhases.Phase3.Title', duration: 60 },
      { name: 'HEIST.GamePhases.Phase4.Title', duration: 30 },
      { name: 'HEIST.GamePhases.Phase5.Title', duration: 90 },
    ];
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
      phases: this.phases,
      currentPhase: this.phases[this.currentPhase],
      timeLeft: this.timeLeft,
      paused: this.paused,
      active: 0 < this.timeLeft,
    };
  }

  activateListeners(html) {
    if (!game.user.isGM) {
      return;
    }

    html.find('[data-pause]').click(this.#onPause.bind(this));
    html.find('[data-next]').click(this.#onNextPhase.bind(this));
    html.find('[data-reset]').click(this.#onReset.bind(this));
  }

  render(force = false, options = {}) {
    if (!game.user.isGM) {
      return this;
    }

    return super.render(force, options);
  }

  #onPause(e) {
    e.preventDefault();

    if (this.paused) {
      this.paused = false;
      this.#startTimeLeftUpdate();
    } else {
      this.paused = true;
      this.#stopTimeLeftUpdate();
    }

    this.render();
  }

  #onNextPhase(e) {
    e.preventDefault();

    this.#changePhase(this.currentPhase + 1);
  }

  #onReset(e) {
    e.preventDefault();

    this.#changePhase(0);
  }

  #changePhase(phase) {
    this.#stopTimeLeftUpdate();
    this.paused = true;
    this.currentPhase = phase;
    game.settings.set(HEIST.SYSTEM_ID, 'currentPhase', this.currentPhase);
    this.#setTimeLeft();

    this.render();
  }

  #setTimeLeft() {
    this.timeLeft = this.phases[this.currentPhase].duration * 60;
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
