export class AgentDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField(),
      deck: new fields.DocumentIdField({
        required: false,
      }),
      pile: new fields.DocumentIdField({
        required: false,
      }),
      hand: new fields.DocumentIdField({
        required: false,
      }),
      agency: new fields.DocumentIdField({
        required: false,
      }),
      dead: new fields.BooleanField(),
      fetishUsed: new fields.BooleanField(),
    };
  }
}
