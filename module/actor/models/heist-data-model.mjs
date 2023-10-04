import { AgentDataModel, GamemasterDataModel } from './_module.mjs';

export class HeistDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      gm: new fields.ForeignDocumentField(GamemasterDataModel, { idOnly: true }),
      agents: new fields.ArrayField(new fields.ForeignDocumentField(AgentDataModel, { idOnly: true })),
    };
  }
}
