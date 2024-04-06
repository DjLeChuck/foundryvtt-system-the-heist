export const SYSTEM_ID = 'heist';

export const COMPENDIUM_DECK_ID = `${SYSTEM_ID}.card-decks`;
export const JACK_DECK_ID = 'HeistDeckJack000';

export const GAME_PHASE_CREATION = 'creation';
export const GAME_PHASE_BRIEFING = 'briefing';
export const GAME_PHASE_RECONNAISSANCE = 'reconnaissance';
export const GAME_PHASE_PLANNING = 'planning';
export const GAME_PHASE_ACTION = 'action';
export const GAME_PHASES = [
  {
    id: GAME_PHASE_CREATION,
    number: 1,
    name: 'HEIST.GamePhases.Phase1.Title',
    defaultDuration: 10,
  },
  {
    id: GAME_PHASE_BRIEFING,
    number: 2,
    name: 'HEIST.GamePhases.Phase2.Title',
    defaultDuration: 10,
  },
  {
    id: GAME_PHASE_RECONNAISSANCE,
    number: 3,
    name: 'HEIST.GamePhases.Phase3.Title',
    defaultDuration: 60,
  },
  {
    id: GAME_PHASE_PLANNING,
    number: 4,
    name: 'HEIST.GamePhases.Phase4.Title',
    defaultDuration: 30,
  },
  {
    id: GAME_PHASE_ACTION,
    number: 5,
    name: 'HEIST.GamePhases.Phase5.Title',
    defaultDuration: 90,
  },
];

export const RECONNAISSANCE_HAND_TRIGGER_LIMIT = 10;
export const RECONNAISSANCE_SUIT_OVERFLOW_LIMIT = 5;

export const SOCKET_REQUESTS = {
  REFRESH_GAME_PHASE_WINDOW: 'refreshGamePhaseWindow',
  REFRESH_AGENT_TEST_WINDOW: 'refreshAgentTestWindow',
  SHOW_AGENT_TEST_WINDOW: 'showAgentTestWindow',
  CLOSE_AGENT_TEST_WINDOW: 'closeAgentTestWindow',
  // Proxy user actions to GM
  GM_HANDLE_AGENT_TEST_BLACKJACK: 'gmHandleAgentTestBlackjack',
  GM_FINISH_AGENT_TEST_WITH_SUCCESS: 'gmFinishAgentTestWithSuccess',
};
