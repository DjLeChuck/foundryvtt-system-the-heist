export class PlanningDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField(),
      cost: new fields.NumberField({
        initial: 1,
        choices: Array.from({ length: 11 }, (_, i) => i),
      }),
    };
  }
}
