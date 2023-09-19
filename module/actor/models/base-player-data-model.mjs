export class BasePlayerDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      deck: new fields.DocumentIdField({
        required: false,
      }),
      hand: new fields.DocumentIdField({
        required: false,
      }),
      pile: new fields.DocumentIdField({
        required: false,
      }),
    };
  }
}
