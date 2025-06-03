export class CurrentTestDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      agency: new fields.DocumentIdField({
        readonly: false,
      }),
      jackCards: new fields.ArrayField(this.#cardsSchema),
      agent: new fields.DocumentIdField({
        readonly: false,
      }),
      agentCards: new fields.ArrayField(this.#cardsSchema),
      isRunning: new fields.BooleanField(),
      isRevealed: new fields.BooleanField(),
      isFinished: new fields.BooleanField(),
      isSuccessful: new fields.BooleanField(),
    };
  }

  static get #cardsSchema() {
    const fields = foundry.data.fields;

    return new fields.SchemaField({
      id: new fields.DocumentIdField({ required: true }),
      name: new fields.StringField({ required: true }),
      value: new fields.NumberField({ required: true }),
      front: new fields.StringField({ required: true }),
      back: new fields.StringField({ required: true }),
      visible: new fields.BooleanField({ required: true }),
      excluded: new fields.BooleanField({ required: true }),
      suit: new fields.StringField({ required: true }),
    });
  }
}
