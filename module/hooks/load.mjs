import * as actor from '../actor/_module.mjs';
import * as item from '../item/_module.mjs';
import * as cards from '../cards/_module.mjs';
import * as HEIST from '../const.mjs';

export const Load = {
  listen() {
    // Define custom Document classes
    CONFIG.Actor.documentClass = actor.documents.BaseActor;
    CONFIG.Item.documentClass = item.documents.BaseItem;
    CONFIG.Cards.documentClass = cards.documents.BaseCards;

    // Register custom Data Model
    CONFIG.Actor.dataModels.agent = actor.models.AgentDataModel;
    CONFIG.Actor.dataModels.heist = actor.models.HeistDataModel;
    CONFIG.Actor.dataModels.npc = actor.models.NpcDataModel;
    CONFIG.Item.dataModels.agentType = item.models.AgentTypeDataModel;
    CONFIG.Item.dataModels.fetish = item.models.FetishDataModel;
    CONFIG.Item.dataModels.planning = item.models.PlanningDataModel;
    CONFIG.Item.dataModels.skill = item.models.SkillDataModel;

    CONFIG.fontDefinitions['Masqualero Groove'] = {
      editor: true,
      fonts: [
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/MasqualeroGroove-Regular.otf`] },
      ],
    };

    CONFIG.fontDefinitions['Masqualero'] = {
      editor: true,
      fonts: [
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/Masqualero-Regular.otf`] },
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/Masqualero-Bold.otf`], weight: 700 },
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/Masqualero-Italic.otf`], style: 'italic' },
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/Masqualero-BoldItalic.otf`], weight: 700, style: 'italic' },
      ],
    };

    CONFIG.fontDefinitions['Bodega Sans'] = {
      editor: true,
      fonts: [
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/BodegaSans-Medium.otf`] },
        { urls: [`systems/${HEIST.SYSTEM_ID}/fonts/BodegaSans-Black.otf`], weight: 700 },
      ],
    };

    CONFIG.defaultFontFamily = 'Masqualero';
  },
};
