import * as documents from '../../documents/_module.mjs';

export class AgentTypeDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      type: new fields.StringField({ required: true, blank: false }),
      deckId: new fields.ForeignDocumentField(documents.HeistCards, { idOnly: true }),
      description: new fields.HTMLField(),
    };
  }
}
