export class PlanningDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      cost: new fields.NumberField({
        initial: 1,
        choices: Array.from({ length: 21 }, (_, i) => i),
      }),
    };
  }
}
