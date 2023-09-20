import * as HEIST from '../../const.mjs';

export class GamePhaseWindow extends Application {
  constructor(options = {}) {
    super(options);

    this.timer = game.settings.get(HEIST.SYSTEM_ID, 'gamePhaseTimer');
    this.phases = [
      { name: '_Création des personnages en mode one-shot', duration: 10 },
      { name: '_Briefing', duration: 10 },
      { name: '_Reconnaissance', duration: 60 },
      { name: '_Planification', duration: 30 },
      { name: '_Action', duration: 90 },
    ];
    this.paused = false;
    this.intervalId = null;

    this.#setTimeLeft();
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'game-phase-window'],
      template: `systems/${HEIST.SYSTEM_ID}/templates/app/game-phase-window.html.hbs`,
      width: 500,
      height: 600,
    });
  }

  getData() {
    return {
      phases: this.phases,
      currentPhase: this.phases[this.timer],
      timeLeft: this.timeLeft,
      paused: this.paused,
    };
  }

  activateListeners(html) {
    if (!game.user.isGM) {
      return;
    }

    html.find('[data-pause]').click(this._onPause.bind(this));
    html.find('[data-next]').click(this._onNextPhase.bind(this));
    html.find('[data-reinit]').click(this._onReinit.bind(this));

    if (!this.paused) {
      this.startTimeLeftUpdate();
    }
  }

  render(force = false, options = {}) {
    if (!game.user.isGM) {
      return this;
    }

    return super.render(force, options);
  }

  startTimeLeftUpdate() {
    this.stopTimeLeftUpdate();

    this.intervalId = setInterval(() => {
      this.timeLeft -= 1;

      // if (this.timeLeft < 0) {
      //   this.stopTimeLeftUpdate();
      //   this.onNextPhase();
      //
      //   return;
      // }

      this.render(false);
    }, 1000);
  }

  stopTimeLeftUpdate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);

      this.intervalId = null;
    }
  }

  _onPause(e) {
    e.preventDefault();

    if (this.paused) {
      this.paused = false;
      this.startTimeLeftUpdate();
    } else {
      this.paused = true;
      this.stopTimeLeftUpdate();
    }

    this.render();
  }

  _onNextPhase(e) {
    e.preventDefault();

    this.timer++;
    game.settings.set(HEIST.SYSTEM_ID, 'gamePhaseTimer', this.timer);
    this.#setTimeLeft();

    this.render();
  }

  _onReinit(e) {
    e.preventDefault();

    this.timer = 0;
    game.settings.set(HEIST.SYSTEM_ID, 'gamePhaseTimer', this.timer);
    this.#setTimeLeft();

    this.render();
  }

  #setTimeLeft() {
    this.timeLeft = this.phases[this.timer].duration;// * 60;
  }
}
