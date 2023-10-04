import { AgentDataModel, JackDataModel } from './_module.mjs';

export class HeistDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      jack: new fields.ForeignDocumentField(JackDataModel, { idOnly: true }),
      agents: new fields.ArrayField(new fields.ForeignDocumentField(AgentDataModel, { idOnly: true })),
    };
  }
}
