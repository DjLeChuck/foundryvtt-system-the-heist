export class FetishDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      used: new fields.BooleanField(),
    };
  }
}
