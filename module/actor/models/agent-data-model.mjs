import { BasePlayerDataModel } from './base-player-data-model.mjs';

export class AgentDataModel extends BasePlayerDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return Object.assign({}, super.defineSchema(), {
      description: new fields.HTMLField(),
      hand: new fields.DocumentIdField({
        required: false,
      }),
    });
  }
}
