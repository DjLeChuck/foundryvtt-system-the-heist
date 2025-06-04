import { AgentDataModel } from './_module.mjs';
import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';
import { range } from '../../helpers/utils.mjs';

export class HeistDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const jokerPhaseConfiguration = (numberOfPile = 0, firstJoker = 0, secondJoker = 0) => new fields.SchemaField({
      numberOfPile: new fields.NumberField({
        label: 'HEIST.HeistSheet.Jokers.NumberOfPiles',
        initial: numberOfPile,
        choices: range(0, 10),
        integer: true,
      }),
      firstJokerPile: new fields.NumberField({
        label: 'HEIST.HeistSheet.Jokers.FirstJokerPosition',
        initial: firstJoker,
        integer: true,
      }),
      secondJokerPile: new fields.NumberField({
        label: 'HEIST.HeistSheet.Jokers.SecondJokerPosition',
        initial: secondJoker,
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
          min: 0,
          max: 10,
          step: 2,
          initial: 0,
        }),
        improvisation: new fields.BooleanField(),
        network: new fields.BooleanField(),
        rescue: new fields.BooleanField(),
      }),
    };
  }

  /**
   * @returns {Cards|null}
   */
  get jackDeck() {
    return game.cards.get(this.jack.deck);
  }

  /**
   * @returns {Cards|null}
   */
  get jackPile() {
    return game.cards.get(this.jack.pile);
  }

  /**
   * @returns {Cards|null}
   */
  get jackTestHand() {
    return game.cards.get(this.jack.testHand);
  }

  /**
   * @returns {Cards|null}
   */
  get jackReconnaissanceHand() {
    return game.cards.get(this.jack.reconnaissanceHand);
  }

  get jackCanDraw() {
    return this.jackDeck?.availableCards.length > 0;
  }

  get jackCanAskTest() {
    return this.jackDeck?.availableCards.length >= 3;
  }

  /**
   * @returns {HeistActor}
   */
  get spadeDocument() {
    return game.actors.get(this.spade);
  }

  /**
   * @returns {HeistActor}
   */
  get heartDocument() {
    return game.actors.get(this.heart);
  }

  /**
   * @returns {HeistActor}
   */
  get diamondDocument() {
    return game.actors.get(this.diamond);
  }

  /**
   * @returns {HeistActor}
   */
  get clubDocument() {
    return game.actors.get(this.club);
  }

  /**
   * @returns {HeistActor[]}
   */
  get agents() {
    return [this.clubDocument, this.heartDocument, this.diamondDocument, this.spadeDocument].filter(agent => null !== agent);
  }

  /**
   * @return {Number}
   */
  get totalAvailableCredits() {
    return this.availableCredits + this.progression.budgetAugmentation;
  }

  get agentExtraSkills() {
    let extraSkills = 0;

    if (this.progression.firstAgentTraining) {
      extraSkills += 2;
    }

    if (this.progression.secondJoker) {
      extraSkills += 2;
    }

    if (this.progression.thirdAgentTraining) {
      extraSkills += 2;
    }

    return extraSkills;
  }

  /**
   * @return {Card[]}
   */
  get jackJokers() {
    return this.jackDeck?.availableCards.filter((card) => 'jokers' === card.suit);
  }

  /**
   * @param {Cards} hand
   * @param {Number} number
   * @returns {Promise<Card[]>}
   */
  async jackDrawCards(hand, number) {
    const cards = await hand.draw(this.jackDeck, number, { chatNotification: false });

    this.parent.sheet.render(false);

    return cards;
  }

  /**
   * @param {Cards} hand
   * @param {Number} jokerNumber
   * @returns {Promise<Card|null>}
   */
  async jackDrawJoker(hand, jokerNumber) {
    const jokers = this.jackJokers;
    if (!jokers[jokerNumber]) {
      return null;
    }

    const card = await this.jackDeck?.pass(hand, [jokers[jokerNumber].id], { chatNotification: false });

    this.parent.sheet.render(false);

    return card[0];
  }

  async jackThrowTestHand() {
    await this.#throwHand(this.jackTestHand);
  }

  jackNextDrawHasJoker() {
    const cards = this.jackDeck.cards.contents.sort(this.jackDeck?.sortShuffled)
      .filter((card) => !card.drawn)
      .splice(0, 3);

    return CARDS.includesJoker(cards);
  }

  async _onCreate(data, options, userId) {
    await this.#createDecks();
  }

  async _onDelete(options, userId) {
    await this.#deleteDecks();
  }

  #baseDeck() {
    return game.packs.get(HEIST.COMPENDIUM_DECK_ID).getDocument(HEIST.JACK_DECK_ID);
  }

  async #createDeck() {
    const baseDeck = await this.#baseDeck();

    return await Cards.implementation.create(foundry.utils.mergeObject(baseDeck.toObject(false), {
      name: game.i18n.format('HEIST.Cards.DeckName', { name: this.parent.name }),
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    }));
  }

  async #createPile() {
    return await Cards.implementation.create({
      name: game.i18n.format('HEIST.Cards.PileName', { name: this.parent.name }),
      type: 'pile',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #createHand(nameKey) {
    return await Cards.implementation.create({
      name: game.i18n.format(nameKey, { name: this.parent.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #createDecks() {
    const deck = await this.#createDeck();
    const pile = await this.#createPile();
    const testHand = await this.#createHand('HEIST.Cards.TestHandName');
    const reconnaissanceHand = await this.#createHand('HEIST.Cards.RecognitionHandName');

    // Shuffle the cloned deck
    await this.#shuffleDeck(deck);

    await this.#saveCreatedDecks({
      deck: deck.id,
      pile: pile.id,
      testHand: testHand.id,
      reconnaissanceHand: reconnaissanceHand.id,
    });
  }

  async #saveCreatedDecks(decks) {
    await this.parent.update({ system: { jack: { ...decks } } });
  }

  async #deleteDecks() {
    if (!game.users.activeGM) {
      return;
    }

    await this.jackDeck?.delete();
    await this.jackPile?.delete();
    await this.jackTestHand?.delete();
    await this.jackReconnaissanceHand?.delete();
  }

  async #onChangeGamePhase(phase) {
    await this.#removeJokers();

    if ([HEIST.GAME_PHASE_RECONNAISSANCE, HEIST.GAME_PHASE_ACTION].includes(phase.id)) {
      await this.#recallDeck();
      await this.#injectJokers(phase);
    }

    this.parent.sheet.render(false);
  }

  async #throwHand(hand) {
    await hand.pass(this.jackPile, hand.cards.map((c) => c.id), { chatNotification: false });

    this.parent.sheet.render(false);
  }

  async #shuffleDeck(deck) {
    await deck.shuffle({ chatNotification: false });
  }

  async #recallDeck() {
    await this.jackDeck?.recall({ chatNotification: false });
  }

  async #removeJokers() {
    if (!this.jackDeck) {
      return;
    }

    this.jackDeck.cards.forEach((card) => {
      if ('jokers' === card.suit) {
        card.delete();
      }
    });
  }

  async #injectJokers(phase) {
    /** @var JokerPhaseConfiguration|null */
    const config = this.jack.jokerPhasesConfigurations[phase.id] || null;
    if (null === config || 0 === config.numberOfPile) {
      return;
    }

    const positions = this.#calculateJokersPositions(this.jackDeck, config);
    const jokers = [];

    if (null !== positions.firstJoker) {
      jokers.push(CARDS.getJokerData(positions.firstJoker));
    }

    if (null !== positions.secondJoker) {
      jokers.push(CARDS.getJokerData(positions.secondJoker));
    }

    await this.jackDeck.createEmbeddedDocuments('Card', jokers, { renderSheet: false });
  }

  /**
   * @param {Cards} deck
   * @param {JokerPhaseConfiguration} config
   * @return {{firstJoker: number|null, secondJoker: number|null}}
   */
  #calculateJokersPositions(deck, config) {
    const availableCards = deck.availableCards.length;
    const cardsPerPile = availableCards / config.numberOfPile;

    const positions = {
      firstJoker: null,
      secondJoker: null,
    };

    if (0 < config.firstJokerPile) {
      const offsetFirstJoker = (config.firstJokerPile - 1) * cardsPerPile;
      positions.firstJoker = Math.floor(offsetFirstJoker + Math.random() * cardsPerPile);
    }

    if (0 < config.secondJokerPile) {
      const offsetSecondJoker = (config.secondJokerPile - 1) * cardsPerPile;
      positions.secondJoker = Math.floor(offsetSecondJoker + Math.random() * cardsPerPile);
    }

    return positions;
  }
}
