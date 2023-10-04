import { AgentDataModel, JackDataModel } from './_module.mjs';

export class HeistDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      jack: new fields.ForeignDocumentField(JackDataModel, { idOnly: true }),
      diamond: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      heart: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      spade: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      club: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
    };
  }
}
