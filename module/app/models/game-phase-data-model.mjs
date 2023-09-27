export class GamePhaseDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      current: new fields.NumberField(),
      paused: new fields.BooleanField({
        initial: true,
      }),
      timeLeft: new fields.NumberField(),
    };
  }
}
