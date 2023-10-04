import { BaseCards } from '../../cards/documents/_module.mjs';

export class AgentTypeDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      type: new fields.StringField({ required: true, blank: false }),
      deckId: new fields.ForeignDocumentField(BaseCards, { idOnly: true }),
      description: new fields.HTMLField(),
    };
  }
}
