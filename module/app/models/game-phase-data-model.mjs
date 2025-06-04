import * as HEIST from '../../const.mjs';

export class GamePhaseDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      current: new fields.NumberField({
        initial: 0,
      }),
      paused: new fields.BooleanField({
        initial: true,
      }),
      timeLeft: new fields.NumberField({
        initial: HEIST.GAME_PHASES[0].defaultDuration * 60,
      }),
    };
  }
}
