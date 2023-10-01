import { BaseItemSheet } from './base-item-sheet.mjs';

export class PlanningItemSheet extends BaseItemSheet {
  /** @override */
  async getData() {
    const context = await super.getData();

    const costsChoices = this.object.system.schema.fields.cost.choices;
    context.costChoices = costsChoices.reduce((acc, val) => {
      acc[val] = val;
      return acc;
    }, {});

    return context;
  }
}
