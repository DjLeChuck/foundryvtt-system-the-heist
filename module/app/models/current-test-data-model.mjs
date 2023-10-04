export class CurrentTestDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      jack: new fields.DocumentIdField({
        readonly: false,
      }),
      agent: new fields.DocumentIdField({
        readonly: false,
      }),
      isRevealed: new fields.BooleanField(),
      isFinished: new fields.BooleanField(),
      isSuccessful: new fields.BooleanField(),
    };
  }
}
