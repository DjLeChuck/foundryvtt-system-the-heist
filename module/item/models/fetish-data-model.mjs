export class FetishDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField(),
      used: new fields.BooleanField(),
    };
  }
}
