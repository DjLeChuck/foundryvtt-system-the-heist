export class CardWindow extends Application {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['the-heist', 'card-window'],
      template: 'systems/the-heist/templates/app/card-window.html.hbs',
      width: 750,
      height: 690,
      card: null,
    });
  }

  getData() {
    // Ici vous pouvez insérer les données nécessaires pour votre fenêtre.
    // Exemple: la carte actuellement tirée
    return { card: this.options.card };
  }

  // Events listeners
  activateListeners(html) {
    // Vous pouvez attacher des écouteurs d'événements ici pour interagir avec votre fenêtre.
  }

  setCard(card) {
    this.options.card = card;

    this.render(true);
  }
}
