export class CurrentTestDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const cardsSchema = new fields.SchemaField({
      id: new fields.DocumentIdField({ required: true }),
      name: new fields.StringField({ required: true }),
      value: new fields.NumberField({ required: true }),
      front: new fields.StringField({ required: true }),
      back: new fields.StringField({ required: true }),
      visible: new fields.BooleanField({ required: true }),
      excluded: new fields.BooleanField({ required: true }),
    });

    return {
      agency: new fields.DocumentIdField({
        readonly: false,
      }),
      jackCards: new fields.ArrayField(cardsSchema),
      agent: new fields.DocumentIdField({
        readonly: false,
      }),
      agentCards: new fields.ArrayField(cardsSchema),
      isRunning: new fields.BooleanField(),
      isRevealed: new fields.BooleanField(),
      isFinished: new fields.BooleanField(),
      isSuccessful: new fields.BooleanField(),
    };
  }
}
