export class SkillDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      locked: new fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
      }),
    };
  }
}
