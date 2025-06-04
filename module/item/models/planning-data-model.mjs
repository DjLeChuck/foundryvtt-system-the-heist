export class PlanningDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      cost: new fields.NumberField({
        label: 'HEIST.PlanningItem.Cost',
        initial: 1,
        choices: Array.from({ length: 21 }, (_, i) => i),
      }),
    };
  }
}
