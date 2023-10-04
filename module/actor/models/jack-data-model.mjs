import { BasePlayerDataModel } from './base-player-data-model.mjs';

export class JackDataModel extends BasePlayerDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return Object.assign({}, super.defineSchema(), {
      testHand: new fields.DocumentIdField({
        required: false,
      }),
      reconnaissanceHand: new fields.DocumentIdField({
        required: false,
      }),
      agents: new fields.ArrayField(new fields.DocumentIdField()),
    });
  }
}
