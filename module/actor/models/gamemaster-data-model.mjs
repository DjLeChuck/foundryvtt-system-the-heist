import { BasePlayerDataModel } from './base-player-data-model.mjs';

export class GamemasterDataModel extends BasePlayerDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return Object.assign({}, super.defineSchema(), {
      agents: new fields.ArrayField(new fields.DocumentIdField()),
    });
  }
}
