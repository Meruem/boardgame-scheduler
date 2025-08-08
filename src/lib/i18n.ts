// Internationalization utilities
export type Locale = 'en' | 'cs';

export interface Translations {
  // Common
  loading: string;
  error: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  confirm: string;
  
  // Header
  title: string;
  subtitle: string;
  
  // Navigation
  activeSessions: string;
  retiredSessions: string;
  createNewSession: string;
  
  // Session management
  gameSessions: string;
  noSessionsScheduled: string;
  createFirstSession: string;
  sessionFinished: string;
  open: string;
  full: string;
  finished: string;
  
  // Session details
  game: string;
  time: string;
  complexity: string;
  players: string;
  maxPlayers: string;
  minTime: string;
  maxTime: string;
  description: string;
  scheduledFor: string;
  minutes: string;
  signedUp: string;
  
  // Actions
  joinSession: string;
  leaveSession: string;
  removePlayer: string;
  join: string;
  editSession: string;
  deleteSession: string;
  yourName: string;
  deleting: string;
  creating: string;
  updating: string;
  createSession: string;
  updateSession: string;
  
  // Forms
  boardGameName: string;
  scheduledAt: string;
  selectGame: string;
  searchGames: string;
  noGamesFound: string;
  minTimeMinutes: string;
  maxTimeMinutes: string;
  sessionDescription: string;
  searchBoardGame: string;
  startTypingToSearchBoardGameGeek: string;
  dateTime: string;
  date: string;
  startTime: string;
  endTime: string;
  simple: string;
  complex: string;
  gameDescriptionAutoFilled: string;
  maxPlayersMinSignups: string;
  
  // Date labels
  today: string;
  tomorrow: string;
  noSessionsScheduledForDate: string;
  createSessionForDate: string;
  past: string;
  session: string;
  createNewSessionForDate: string;
  
  // Messages
  sessionCreated: string;
  sessionUpdated: string;
  sessionDeleted: string;
  playerJoined: string;
  playerRemoved: string;
  failedToCreateSession: string;
  failedToUpdateSession: string;
  failedToDeleteSession: string;
  failedToJoinSession: string;
  failedToRemovePlayer: string;
  confirmDeleteSession: string;
  
  // Validation
  required: string;
  invalidDate: string;
  invalidTime: string;
  maxPlayersMustBeGreater: string;
  minTimeMustBePositive: string;
  maxTimeMustBePositive: string;
  maxTimeMustBeGreaterThanMin: string;
  
  // Language selector
  language: string;
  english: string;
  czech: string;
  
  // Comments
  comments: string;
  addComment: string;
  commentAuthor: string;
  commentContent: string;
  postComment: string;
  noComments: string;
  commentPosted: string;
  commentDeleted: string;
  failedToPostComment: string;
  failedToDeleteComment: string;
  confirmDeleteComment: string;
  authorNameRequired: string;
  commentContentRequired: string;
  commentPlaceholder: string;
}

const translations: Record<Locale, Translations> = {
  en: {
    // Common
    loading: 'Loading sessions...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    
    // Header
    title: 'Board Game Scheduler',
    subtitle: 'Schedule and join board game sessions with friends',
    
    // Navigation
    activeSessions: 'Active Sessions',
    retiredSessions: 'Retired Sessions',
    createNewSession: 'Create New Session',
    
    // Session management
    gameSessions: 'Game Sessions',
    noSessionsScheduled: 'No sessions scheduled yet',
    createFirstSession: 'Create Your First Session',
    sessionFinished: 'Session Finished',
    open: 'Open',
    full: 'Full',
    finished: 'Finished',
    
    // Session details
    game: 'Game',
    time: 'Time',
    complexity: 'Complexity',
    players: 'Players',
    maxPlayers: 'Max Players',
    minTime: 'Min Time',
    maxTime: 'Max Time',
    description: 'Description',
    scheduledFor: 'Scheduled for',
    minutes: 'min',
    signedUp: 'Signed up',
    
    // Actions
    joinSession: 'Join Session',
    leaveSession: 'Leave Session',
    removePlayer: 'Remove player',
    join: 'Join',
    editSession: 'Edit Session',
    deleteSession: 'Delete Session',
    yourName: 'Your name',
    deleting: 'Deleting...',
    creating: 'Creating...',
    updating: 'Updating...',
    createSession: 'Create Session',
    updateSession: 'Update Session',
    
    // Forms
    boardGameName: 'Board Game Name',
    scheduledAt: 'Scheduled At',
    selectGame: 'Select Game',
    searchGames: 'Search games...',
    noGamesFound: 'No games found',
    minTimeMinutes: 'Min Time (minutes)',
    maxTimeMinutes: 'Max Time (minutes)',
    sessionDescription: 'Session Description',
    searchBoardGame: 'Search for a board game...',
    startTypingToSearchBoardGameGeek: 'Start typing to search BoardGameGeek database. Selecting a game will auto-fill complexity and time.',
    dateTime: 'Date & Time (24-hour format)',
    date: 'Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    simple: 'Simple',
    complex: 'Complex',
    gameDescriptionAutoFilled: 'Game description will be auto-filled from BoardGameGeek when you select a game...',
    maxPlayersMinSignups: 'Cannot be less than current signups ({minSignups})',
    
    // Date labels
    today: 'Today',
    tomorrow: 'Tomorrow',
    noSessionsScheduledForDate: 'No sessions scheduled',
    createSessionForDate: 'Create a new session for this date',
    past: '(Past)',
    session: 'session',
    createNewSessionForDate: 'Create a new session for this date',
    
    // Messages
    sessionCreated: 'Session created successfully',
    sessionUpdated: 'Session updated successfully',
    sessionDeleted: 'Session deleted successfully',
    playerJoined: 'Player joined successfully',
    playerRemoved: 'Player removed successfully',
    failedToCreateSession: 'Failed to create session',
    failedToUpdateSession: 'Failed to update session',
    failedToDeleteSession: 'Failed to delete session',
    failedToJoinSession: 'Failed to join session',
    failedToRemovePlayer: 'Failed to remove player',
    confirmDeleteSession: 'Are you sure you want to delete "{sessionName}"? This action cannot be undone and will remove all signups.',
    
    // Validation
    required: 'This field is required',
    invalidDate: 'Invalid date',
    invalidTime: 'Invalid time',
    maxPlayersMustBeGreater: 'Max players must be greater than or equal to current signups',
    minTimeMustBePositive: 'Min time must be positive',
    maxTimeMustBePositive: 'Max time must be positive',
    maxTimeMustBeGreaterThanMin: 'Max time must be greater than or equal to min time',
    
    // Language selector
    language: 'Language',
    english: 'English',
    czech: 'Čeština',
    
    // Comments
    comments: 'Comments',
    addComment: 'Add Comment',
    commentAuthor: 'Author',
    commentContent: 'Comment',
    postComment: 'Post Comment',
    noComments: 'No comments yet',
    commentPosted: 'Comment posted successfully',
    commentDeleted: 'Comment deleted successfully',
    failedToPostComment: 'Failed to post comment',
    failedToDeleteComment: 'Failed to delete comment',
    confirmDeleteComment: 'Are you sure you want to delete this comment?',
    authorNameRequired: 'Author name is required',
    commentContentRequired: 'Comment content is required',
    commentPlaceholder: 'Write a comment...',
  },
  cs: {
    // Common
    loading: 'Načítání sezení...',
    error: 'Chyba',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Smazat',
    edit: 'Upravit',
    close: 'Zavřít',
    confirm: 'Potvrdit',
    
    // Header
    title: 'Plánovač Deskových Her',
    subtitle: 'Naplánujte a připojte se k sezením deskových her s přáteli',
    
    // Navigation
    activeSessions: 'Aktivní Sezení',
    retiredSessions: 'Ukončená Sezení',
    createNewSession: 'Vytvořit Nové Sezení',
    
    // Session management
    gameSessions: 'Sezení Deskových Her',
    noSessionsScheduled: 'Zatím nejsou naplánována žádná sezení',
    createFirstSession: 'Vytvořte Vaše První Sezení',
    sessionFinished: 'Sezení Ukončeno',
    open: 'Otevřené',
    full: 'Plné',
    finished: 'Ukončené',
    
    // Session details
    game: 'Hra',
    time: 'Čas',
    complexity: 'Složitost',
    players: 'Hráči',
    maxPlayers: 'Max Hráčů',
    minTime: 'Min Čas',
    maxTime: 'Max Čas',
    description: 'Popis',
    scheduledFor: 'Naplánováno na',
    minutes: 'min',
    signedUp: 'Přihlášeni',
    
    // Actions
    joinSession: 'Připojit Se',
    leaveSession: 'Opustit Sezení',
    removePlayer: 'Odebrat hráče',
    join: 'Připojit',
    editSession: 'Upravit Sezení',
    deleteSession: 'Smazat Sezení',
    yourName: 'Vaše jméno',
    deleting: 'Maže se...',
    creating: 'Vytváří se...',
    updating: 'Aktualizuje se...',
    createSession: 'Vytvořit Sezení',
    updateSession: 'Aktualizovat Sezení',
    
    // Forms
    boardGameName: 'Název Deskové Hry',
    scheduledAt: 'Naplánováno Na',
    selectGame: 'Vybrat Hru',
    searchGames: 'Hledat hry...',
    noGamesFound: 'Nebyly nalezeny žádné hry',
    minTimeMinutes: 'Min Čas (minuty)',
    maxTimeMinutes: 'Max Čas (minuty)',
    sessionDescription: 'Popis Sezení',
    searchBoardGame: 'Hledat deskovou hru...',
    startTypingToSearchBoardGameGeek: 'Začněte psát pro vyhledávání v databázi BoardGameGeek. Výběr hry automaticky vyplní složitost a čas.',
    dateTime: 'Datum a Čas (24hodinový formát)',
    date: 'Datum',
    startTime: 'Začátek',
    endTime: 'Konec',
    simple: 'Jednoduchá',
    complex: 'Složitá',
    gameDescriptionAutoFilled: 'Popis hry bude automaticky vyplněn z BoardGameGeek při výběru hry...',
    maxPlayersMinSignups: 'Nemůže být méně než současná přihlášení ({minSignups})',
    
    // Date labels
    today: 'Dnes',
    tomorrow: 'Zítra',
    noSessionsScheduledForDate: 'Není naplánováno žádné sezení',
    createSessionForDate: 'Vytvořte nové sezení pro tento den',
    past: '(Minulé)',
    session: 'sezení',
    createNewSessionForDate: 'Vytvořte nové sezení pro tento den',
    
    // Messages
    sessionCreated: 'Sezení bylo úspěšně vytvořeno',
    sessionUpdated: 'Sezení bylo úspěšně aktualizováno',
    sessionDeleted: 'Sezení bylo úspěšně smazáno',
    playerJoined: 'Hráč se úspěšně připojil',
    playerRemoved: 'Hráč byl úspěšně odebrán',
    failedToCreateSession: 'Nepodařilo se vytvořit sezení',
    failedToUpdateSession: 'Nepodařilo se aktualizovat sezení',
    failedToDeleteSession: 'Nepodařilo se smazat sezení',
    failedToJoinSession: 'Nepodařilo se připojit k sezení',
    failedToRemovePlayer: 'Nepodařilo se odebrat hráče',
    confirmDeleteSession: 'Opravdu chcete smazat "{sessionName}"? Tuto akci nelze vrátit zpět a odstraní všechna přihlášení.',
    
    // Validation
    required: 'Toto pole je povinné',
    invalidDate: 'Neplatné datum',
    invalidTime: 'Neplatný čas',
    maxPlayersMustBeGreater: 'Maximální počet hráčů musí být větší nebo rovný současným přihlášením',
    minTimeMustBePositive: 'Minimální čas musí být kladný',
    maxTimeMustBePositive: 'Maximální čas musí být kladný',
    maxTimeMustBeGreaterThanMin: 'Maximální čas musí být větší nebo rovný minimálnímu času',
    
    // Language selector
    language: 'Jazyk',
    english: 'English',
    czech: 'Čeština',
    
    // Comments
    comments: 'Komentáře',
    addComment: 'Přidat komentář',
    commentAuthor: 'Autor',
    commentContent: 'Komentář',
    postComment: 'Odeslat komentář',
    noComments: 'Zatím žádné komentáře',
    commentPosted: 'Komentář úspěšně odeslán',
    commentDeleted: 'Komentář úspěšně smazán',
    failedToPostComment: 'Nepodařilo se odeslat komentář',
    failedToDeleteComment: 'Nepodařilo se smazat komentář',
    confirmDeleteComment: 'Opravdu chcete smazat tento komentář?',
    authorNameRequired: 'Jméno autora je povinné',
    commentContentRequired: 'Obsah komentáře je povinný',
    commentPlaceholder: 'Napište komentář...',
  },
};

// Get user's preferred locale from localStorage or browser
export const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  
  const saved = localStorage.getItem('locale') as Locale;
  if (saved && (saved === 'en' || saved === 'cs')) {
    return saved;
  }
  
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'cs' ? 'cs' : 'en';
};

// Get translation for current locale
export const t = (locale: Locale, key: keyof Translations): string => {
  return translations[locale][key] || translations.en[key] || key;
};

// Format date according to locale
export const formatDate = (date: Date, locale: Locale): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  
  return date.toLocaleString(locale === 'cs' ? 'cs-CZ' : 'en-GB', options);
};

// Format date for display in lanes
export const formatDateForLane = (date: Date, locale: Locale): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return t(locale, 'today');
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return t(locale, 'tomorrow');
  } else {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-GB', options);
  }
};
