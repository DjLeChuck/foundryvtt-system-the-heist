export class GamePhaseDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      current: new fields.NumberField({
        initial: 1,
      }),
      paused: new fields.BooleanField({
        initial: true,
      }),
      timeLeft: new fields.NumberField({
        initial: 10,
      }),
    };
  }
}
