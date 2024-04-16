import { AgentDataModel, JackDataModel } from './_module.mjs';

export class HeistDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const jokerPhaseConfiguration = (numberOfPile = 0, firstJoker = 0, secondJoker = 0) => new fields.SchemaField({
      numberOfPile: new fields.NumberField({
        initial: numberOfPile,
        step: 1,
        integer: true,
      }),
      firstJokerPile: new fields.NumberField({
        initial: firstJoker,
        step: 1,
        integer: true,
      }),
      secondJokerPile: new fields.NumberField({
        initial: secondJoker,
        step: 1,
        integer: true,
      }),
    });

    return {
      jack: new fields.ForeignDocumentField(JackDataModel, { idOnly: true }),
      diamond: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      heart: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      spade: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      club: new fields.ForeignDocumentField(AgentDataModel, { idOnly: true }),
      plan: new fields.HTMLField(),
      availableCredits: new fields.NumberField({
        required: true,
        initial: 10,
        step: 1,
        integer: true,
        positive: true,
      }),
      jokerPhasesConfigurations: new fields.SchemaField({
        reconnaissance: jokerPhaseConfiguration(),
        action: jokerPhaseConfiguration(5, 2, 4),
      }),
    };
  }
}
