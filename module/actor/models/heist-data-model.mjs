import { AgentDataModel } from './_module.mjs';

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
      jack: new fields.SchemaField({
        deck: new fields.DocumentIdField({
          required: false,
        }),
        pile: new fields.DocumentIdField({
          required: false,
        }),
        testHand: new fields.DocumentIdField({
          required: false,
        }),
        reconnaissanceHand: new fields.DocumentIdField({
          required: false,
        }),
        jokerPhasesConfigurations: new fields.SchemaField({
          reconnaissance: jokerPhaseConfiguration(),
          action: jokerPhaseConfiguration(5, 2, 4),
        }),
      }),
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
      progression: new fields.SchemaField({
        firstAgentTraining: new fields.BooleanField(),
        secondAgentTraining: new fields.BooleanField(),
        thirdAgentTraining: new fields.BooleanField(),
        budgetAugmentation: new fields.NumberField({
          max: 10,
          step: 2,
        }),
        improvisation: new fields.BooleanField(),
        network: new fields.BooleanField(),
        rescue: new fields.BooleanField(),
      }),
    };
  }
}
