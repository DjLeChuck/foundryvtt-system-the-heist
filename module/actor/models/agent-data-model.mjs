export class AgentDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField(),
      deck: new fields.DocumentIdField({
        required: false,
      }),
      pile: new fields.DocumentIdField({
        required: false,
      }),
      hand: new fields.DocumentIdField({
        required: false,
      }),
      agency: new fields.DocumentIdField({
        required: false,
      }),
      dead: new fields.BooleanField(),
      fetishUsed: new fields.BooleanField(),
    };
  }

  /**
   * @returns {Cards|null}
   */
  get deckDocument() {
    if (!this.deck) {
      return null;
    }

    return game.cards.get(this.deck);
  }

  /**
   * @returns {Cards|null}
   */
  get pileDocument() {
    if (!this.pile) {
      return null;
    }

    return game.cards.get(this.pile);
  }

  /**
   * @returns {Cards|null}
   */
  get handDocument() {
    return game.cards.get(this.hand);
  }

  /**
   * @returns {HeistActor|null}
   */
  get agencyDocument() {
    if (!this.agency) {
      return null;
    }

    return game.actors.get(this.agency);
  }

  /**
   * @returns {HeistItem|null}
   */
  get agentType() {
    return this.parent.items.find((item) => 'agentType' === item.type) ?? null;
  }

  /**
   * @returns {HeistItem|null}
   */
  get fetish() {
    return this.parent.items.find((item) => 'fetish' === item.type) ?? null;
  }

  /**
   * @returns {HeistItem[]}
   */
  get skills() {
    return this.parent.items.filter((item) => 'skill' === item.type);
  }

  get canUseFetish() {
    return null !== this.fetish && !this.fetishUsed;
  }

  get canLearnSkill() {
    return this.#maxSkills > this.skills.length;
  }

  get canDraw() {
    return 0 < this.deck.availableCards.length;
  }

  /**
   * @return {boolean}
   */
  get isDead() {
    return this.dead;
  }

  /**
   * @return {boolean}
   */
  get canBeTested() {
    return !this.isDead && this.canDraw;
  }

  get #maxSkills() {
    return 2 + (this.agency?.agentExtraSkills || 0);
  }

  /**
   * @param {number} number
   * @returns {Promise<Card[]>}
   */
  async drawCards(number) {
    const cards = await this.hand.draw(this.deck, number, { chatNotification: false });

    this.render(false);

    return cards;
  }

  async throwHand() {
    await this.hand.pass(this.pile, this.hand.cards.map((c) => c.id), { chatNotification: false });

    this.render(false);
  }

  async useFetish() {
    if (!this.fetish) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.NoFetishObject'));

      return;
    }

    await this.updateSource({ fetishUsed: true });
  }

  async recallHand() {
    const ids = this.hand.cards.map((c) => c.id);

    if (!ids.length) {
      return 0;
    }

    await this.hand.pass(this.deck, ids, { chatNotification: false });

    await this.#shuffleDeck(this.deck);

    return ids.length;
  }

  async recallFromPile(number) {
    const toRecall = Math.min(number, this.pile.availableCards.length);

    if (0 === toRecall) {
      return 0;
    }

    await this.#recallCards(this.pile, this.deck, toRecall);

    return toRecall;
  }

  /**
   * @return {Promise<number|null>}
   */
  async harm() {
    const toRecall = Math.ceil(this.deck.availableCards.length / 2);

    if (0 >= toRecall) {
      return null;
    }

    await this.#recallCards(this.deck, this.pile, toRecall);

    return toRecall;
  }

  async kill() {
    await this.updateSource({ dead: true });
  }

  async resurrect() {
    await this.updateSource({ dead: false });
  }

  async rescue() {
    await this.#recallCards(this.deck, this.pile, this.deck.availableCards.length);
  }

  async #recallCards(from, to, number) {
    await to.draw(from, number, {
      how: CONST.CARD_DRAW_MODES.RANDOM,
      chatNotification: false,
    });

    await this.#shuffleDeck(to);
  }

  async #shuffleDeck(deck) {
    await deck.shuffle({ chatNotification: false });
  }
}
