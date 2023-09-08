/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BaseActor extends Actor {
  constructor(docData, context = {}) {
    if (!context.heist?.ready) {
      mergeObject(context, { heist: { ready: true } });

      const actorConstructor = game.system.heist.actorClasses[docData.type];
      if (actorConstructor) {
        return new actorConstructor(docData, context);
      }
    }

    super(docData, context);
  }
}
