export class FetishDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      used: new fields.BooleanField(),
    };
  }
}
