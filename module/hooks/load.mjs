import * as actor from '../actor/_module.mjs';
import * as item from '../item/_module.mjs';
import * as cards from '../cards/_module.mjs';

export const Load = {
  listen() {
    // Define custom Document classes
    CONFIG.Actor.documentClass = actor.documents.BaseActor;
    CONFIG.Item.documentClass = item.documents.BaseItem;
    CONFIG.Cards.documentClass = cards.documents.BaseCards;

    // Register custom Data Model
    CONFIG.Actor.dataModels.agent = actor.models.AgentDataModel;
    CONFIG.Actor.dataModels.gamemaster = actor.models.GamemasterDataModel;
    CONFIG.Item.dataModels.agentType = item.models.AgentTypeDataModel;
    CONFIG.Item.dataModels.fetish = item.models.FetishDataModel;
    CONFIG.Item.dataModels.skill = item.models.SkillDataModel;

    CONFIG.Canvas.layers.heist = { layerClass: ControlsLayer, group: 'primary' };
  },
};
