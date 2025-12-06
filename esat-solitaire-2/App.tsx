import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayingCard } from './components/PlayingCard';
import { GameState, CardType, Suit, Language, ViewState, GameStats, Difficulty } from './types';
import { createDeck, shuffleDeck, canMoveToFoundation, canMoveToTableau, findAutoMoveTarget, getSuitColor } from './utils/gameLogic';
import { generateCardBackImage } from './services/geminiService';
import { TRANSLATIONS, RELAXING_MUSIC_URL } from './constants';
import { Play, Pause, RotateCcw, Image as ImageIcon, Wand2, Music, VolumeX, Globe, Home, Trophy, BarChart3, Undo2 } from 'lucide-react';

const LOGO_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23000000;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%231e1b4b;stop-opacity:1' /%3E%3C/linearGradient%3E%3ClinearGradient id='txt' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2322d3ee;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23a855f7;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' rx='128' fill='url(%23bg)'/%3E%3Ctext x='50%25' y='57%25' dominant-baseline='middle' text-anchor='middle' font-family='Times New Roman, serif' font-weight='normal' font-size='400' fill='url(%23txt)'%3EE%3C/text%3E%3C/svg%3E";

export default function App() {
  // --- UI State ---
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<ViewState>('welcome');
  const [cardBackUrl, setCardBackUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // --- Game State ---
  const [game, setGame] = useState<GameState | null>(null);
  const [previousState, setPreviousState] = useState<GameState | null>(null);
  const [stats, setStats] = useState<GameStats>({ gamesPlayed: 0, wins: 0, losses: 0 });
  const [draggedCard, setDraggedCard] = useState<{ card: CardType, source: string, index?: number } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('hard');

  const t = TRANSLATIONS[lang];

  // --- Persistence & Initialization ---

  // Load Settings, Stats, and Game from LocalStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('esat_lang');
    if (savedLang) setLang(savedLang as Language);

    const savedStats = localStorage.getItem('esat_stats');
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedGame = localStorage.getItem('esat_game');
    const savedBack = localStorage.getItem('esat_card_back');
    if (savedBack) setCardBackUrl(savedBack);
  }, []);

  // Save Stats
  useEffect(() => {
    localStorage.setItem('esat_stats', JSON.stringify(stats));
  }, [stats]);

  // Save Game State
  useEffect(() => {
    if (game) {
      localStorage.setItem('esat_game', JSON.stringify(game));
    }
  }, [game]);

  // Save Language
  useEffect(() => {
    localStorage.setItem('esat_lang', lang);
  }, [lang]);

  // Save Card Back
  useEffect(() => {
    if (cardBackUrl) localStorage.setItem('esat_card_back', cardBackUrl);
  }, [cardBackUrl]);

  // --- Audio Control ---
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio(RELAXING_MUSIC_URL);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.4;
    }
    
    if (musicPlaying) {
        audioRef.current.play().catch(e => console.log("Audio autoplay prevented", e));
    } else {
        audioRef.current.pause();
    }
  }, [musicPlaying]);

  // --- Logic Helpers ---

  const checkWin = (currentFoundations: CardType[][]) => {
    const totalFoundationCards = currentFoundations.reduce((sum, pile) => sum + pile.length, 0);
    return totalFoundationCards === 52;
  };

  const recordHistory = (currentState: GameState) => {
    setPreviousState(JSON.parse(JSON.stringify(currentState)));
  };

  const handleUndo = () => {
    if (!previousState) return;
    setGame(previousState);
    setPreviousState(null);
  };

  // --- Game Initialization ---
  
  const handleStartNewGame = useCallback((difficulty: Difficulty = selectedDifficulty) => {
    const previousGameStr = localStorage.getItem('esat_game');
    if (previousGameStr) {
        const prevGame: GameState = JSON.parse(previousGameStr);
        if (!prevGame.isWon) {
            setStats(s => ({ ...s, losses: s.losses + 1, gamesPlayed: s.gamesPlayed + 1 }));
        } else {
            setStats(s => ({ ...s, gamesPlayed: s.gamesPlayed + 1 }));
        }
    } else {
        setStats(s => ({ ...s, gamesPlayed: s.gamesPlayed + 1 }));
    }

    const fullDeck = shuffleDeck(createDeck(difficulty));
    
    // Distribute to Tableau
    const newTableau: CardType[][] = Array(7).fill([]).map(() => []);
    let cardIdx = 0;
    
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = fullDeck[cardIdx++];
        if (j === i) card.faceUp = true;
        newTableau[i] = [...newTableau[i], card];
      }
    }

    const newStock = fullDeck.slice(cardIdx);

    const newGame: GameState = {
      stock: newStock,
      waste: [],
      foundations: [[], [], [], []], // 4 Empty Piles
      tableau: newTableau,
      score: 0,
      moves: 0,
      startTime: Date.now(),
      isWon: false,
      difficulty: difficulty
    };

    setGame(newGame);
    setPreviousState(null);
    setView('game');
  }, [selectedDifficulty]);

  const handleResumeGame = () => {
    const savedGame = localStorage.getItem('esat_game');
    if (savedGame) {
        const parsedGame = JSON.parse(savedGame);
        // Check for compatibility (old save format might be Record instead of Array)
        if (!Array.isArray(parsedGame.foundations)) {
            // Old format detected, reset game
            handleStartNewGame(selectedDifficulty);
        } else {
            setGame(parsedGame);
            setPreviousState(null);
            setView('game');
        }
    }
  };

  const handleReturnToMenu = () => {
    setView('welcome');
  };

  // --- Game Interaction Handlers ---

  const handleStockClick = () => {
    if (!game) return;
    recordHistory(game);
    
    if (game.stock.length === 0) {
      if (game.waste.length === 0) return;
      const newStock = [...game.waste].reverse().map(c => ({...c, faceUp: false}));
      setGame({
        ...game,
        stock: newStock,
        waste: [],
        moves: game.moves + 1
      });
      return;
    }

    const newStock = [...game.stock];
    const card = newStock.pop()!;
    card.faceUp = true;
    
    setGame({
      ...game,
      stock: newStock,
      waste: [...game.waste, card],
      moves: game.moves + 1
    });
  };

  const handleCardDoubleClick = (card: CardType, source: 'tableau' | 'waste' | 'foundation', colIndex?: number) => {
    if (!game || !card.faceUp) return;

    // 1. Check if moving UP to Foundation
    const targetFoundationIdx = findAutoMoveTarget(card, game.foundations);
    
    if (targetFoundationIdx !== null) {
      recordHistory(game);
      const newFoundations = [...game.foundations];
      newFoundations[targetFoundationIdx] = [...newFoundations[targetFoundationIdx], card];

      let newTableau = [...game.tableau];
      let newWaste = [...game.waste];
      let scoreIncrease = 10;

      if (source === 'tableau' && typeof colIndex === 'number') {
        newTableau[colIndex] = newTableau[colIndex].slice(0, -1);
        if (newTableau[colIndex].length > 0) {
           const top = newTableau[colIndex][newTableau[colIndex].length - 1];
           if (!top.faceUp) {
             top.faceUp = true;
             scoreIncrease += 5;
           }
        }
      } else if (source === 'waste') {
        newWaste = newWaste.slice(0, -1);
      } else if (source === 'foundation') {
          return; 
      }

      const won = checkWin(newFoundations);
      if (won && !game.isWon) {
          setStats(s => ({ ...s, wins: s.wins + 1 }));
      }

      setGame({
        ...game,
        foundations: newFoundations,
        tableau: newTableau,
        waste: newWaste,
        score: game.score + scoreIncrease,
        moves: game.moves + 1,
        isWon: won
      });
      return; 
    }

    // 2. Check if moving DOWN from Foundation to Tableau
    if (source === 'foundation') {
        let targetTableauIndex = -1;
        for (let i = 0; i < game.tableau.length; i++) {
            const tableauCol = game.tableau[i];
            const topTableauCard = tableauCol.length > 0 ? tableauCol[tableauCol.length - 1] : undefined;
            if (canMoveToTableau(card, topTableauCard, game.difficulty)) {
                targetTableauIndex = i;
                break;
            }
        }

        if (targetTableauIndex !== -1) {
             recordHistory(game);
             const newFoundations = [...game.foundations];
             // We need to find which pile it came from. The source string format for foundation is likely needed
             // But since double click logic passes the card object, we can iterate to find it
             const pileIdx = newFoundations.findIndex(pile => pile.some(c => c.id === card.id));
             if (pileIdx > -1) newFoundations[pileIdx] = newFoundations[pileIdx].slice(0, -1);

             const newTableau = [...game.tableau];
             newTableau[targetTableauIndex] = [...newTableau[targetTableauIndex], card];

             setGame({
                 ...game,
                 foundations: newFoundations,
                 tableau: newTableau,
                 score: game.score - 15,
                 moves: game.moves + 1
             });
        }
    }
  };

  const onDragStart = (e: React.DragEvent, card: CardType, source: string, index?: number) => {
    setDraggedCard({ card, source, index });
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropTableau = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    if (!game || !draggedCard) return;

    const destCol = game.tableau[colIndex];
    const topDestCard = destCol.length > 0 ? destCol[destCol.length - 1] : undefined;

    if (canMoveToTableau(draggedCard.card, topDestCard, game.difficulty)) {
      recordHistory(game);

      let newTableau = [...game.tableau];
      let newWaste = [...game.waste];
      let newFoundations = [...game.foundations];
      let cardsToMove: CardType[] = [];
      let scoreChange = 0;

      if (draggedCard.source === 'waste') {
        cardsToMove = [draggedCard.card];
        newWaste.pop();
      } else if (draggedCard.source.startsWith('tableau')) {
        const sourceColIdx = parseInt(draggedCard.source.split('-')[1]);
        const sourceCol = newTableau[sourceColIdx];
        const splitIdx = sourceCol.findIndex(c => c.id === draggedCard.card.id);
        cardsToMove = sourceCol.slice(splitIdx);
        newTableau[sourceColIdx] = sourceCol.slice(0, splitIdx);
        
        if (newTableau[sourceColIdx].length > 0) {
            const newTop = newTableau[sourceColIdx][newTableau[sourceColIdx].length - 1];
            if (!newTop.faceUp) {
                newTop.faceUp = true;
                scoreChange += 5;
            }
        }
      } else if (draggedCard.source.startsWith('foundation')) {
          const pileIdx = parseInt(draggedCard.source.split('-')[1]);
          cardsToMove = [draggedCard.card];
          newFoundations[pileIdx].pop();
          scoreChange -= 15;
      }

      newTableau[colIndex] = [...newTableau[colIndex], ...cardsToMove];

      setGame({
        ...game,
        tableau: newTableau,
        waste: newWaste,
        foundations: newFoundations,
        moves: game.moves + 1,
        score: game.score + scoreChange
      });
    }
    setDraggedCard(null);
  };

  const onDropFoundation = (e: React.DragEvent, pileIndex: number) => {
    e.preventDefault();
    if (!game || !draggedCard) return;

    let isSingleCard = true;
    if (draggedCard.source.startsWith('tableau')) {
        const sourceColIdx = parseInt(draggedCard.source.split('-')[1]);
        const sourceCol = game.tableau[sourceColIdx];
        const cardIndex = sourceCol.findIndex(c => c.id === draggedCard.card.id);
        if (cardIndex < sourceCol.length - 1) isSingleCard = false;
    }

    if (!isSingleCard) return;

    const foundationPile = game.foundations[pileIndex];
    const topCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : undefined;

    if (canMoveToFoundation(draggedCard.card, topCard)) {
        recordHistory(game);
        
        let newTableau = [...game.tableau];
        let newWaste = [...game.waste];
        let newFoundations = [...game.foundations];
        let scoreChange = 10;

        if (draggedCard.source === 'waste') {
            newWaste.pop();
        } else if (draggedCard.source.startsWith('tableau')) {
            const sourceColIdx = parseInt(draggedCard.source.split('-')[1]);
            const sourceCol = newTableau[sourceColIdx];
            newTableau[sourceColIdx] = sourceCol.slice(0, -1);
            if (newTableau[sourceColIdx].length > 0) {
                const newTop = newTableau[sourceColIdx][newTableau[sourceColIdx].length - 1];
                if (!newTop.faceUp) {
                    newTop.faceUp = true;
                    scoreChange += 5;
                }
            }
        }

        newFoundations[pileIndex] = [...newFoundations[pileIndex], draggedCard.card];

        const won = checkWin(newFoundations);
        if (won && !game.isWon) {
            setStats(s => ({ ...s, wins: s.wins + 1 }));
        }

        setGame({
            ...game,
            tableau: newTableau,
            waste: newWaste,
            foundations: newFoundations,
            score: game.score + scoreChange,
            moves: game.moves + 1,
            isWon: won
        });
    }
    setDraggedCard(null);
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const imageUrl = await generateCardBackImage(aiPrompt);
    if (imageUrl) {
      setCardBackUrl(imageUrl);
    }
    setIsGenerating(false);
    setIsMenuOpen(false);
  };

  if (view === 'welcome') {
      const hasSavedGame = !!localStorage.getItem('esat_game');
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] bg-green-900 opacity-50" />
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/80 to-slate-900/90" />
           
           <div className={`absolute top-6 ${lang === 'ar' ? 'right-6' : 'left-6'} z-20 animate-in fade-in slide-in-from-top-4 duration-700`}>
              <img src={LOGO_URL} alt="Esat Solitaire" className="w-16 h-16 rounded-2xl shadow-2xl hover:scale-105 transition-transform" />
           </div>

           <div className="relative z-10 max-w-lg w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-8 flex flex-col gap-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-600 shadow-lg mb-4">
                         <img src={LOGO_URL} alt="Esat Solitaire" className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">{t.title}</h1>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <button onClick={() => setLang('en')} className={`hover:text-white ${lang === 'en' ? 'text-blue-400 font-bold' : ''}`}>EN</button>
                        <span>•</span>
                        <button onClick={() => setLang('ar')} className={`hover:text-white ${lang === 'ar' ? 'text-blue-400 font-bold' : ''}`}>AR</button>
                        <span>•</span>
                        <button onClick={() => setLang('tr')} className={`hover:text-white ${lang === 'tr' ? 'text-blue-400 font-bold' : ''}`}>TR</button>
                        <span>•</span>
                        <button onClick={() => setLang('de')} className={`hover:text-white ${lang === 'de' ? 'text-blue-400 font-bold' : ''}`}>DE</button>
                    </div>
                </div>

                {/* Difficulty Selection */}
                <div className="grid grid-cols-3 gap-2 bg-slate-700/50 p-2 rounded-xl border border-slate-600">
                  <button 
                    onClick={() => setSelectedDifficulty('easy')} 
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'easy' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.diffEasy}
                  </button>
                  <button 
                    onClick={() => setSelectedDifficulty('medium')} 
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'medium' ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.diffMedium}
                  </button>
                  <button 
                    onClick={() => setSelectedDifficulty('hard')} 
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedDifficulty === 'hard' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    {t.diffHard}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 rounded-xl p-4 text-center border border-slate-600">
                        <div className="flex justify-center mb-2"><BarChart3 className="w-5 h-5 text-purple-400" /></div>
                        <div className="text-2xl font-bold text-white">{stats.gamesPlayed}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">{t.totalGames}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-4 text-center border border-slate-600">
                        <div className="flex justify-center mb-2"><Trophy className="w-5 h-5 text-yellow-400" /></div>
                        <div className="text-2xl font-bold text-white">{stats.wins}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">{t.wins}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-4 text-center border border-slate-600">
                         <div className="flex justify-center mb-2"><span className="text-lg font-bold text-red-400">✕</span></div>
                        <div className="text-2xl font-bold text-white">{stats.losses}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">{t.losses}</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={handleResumeGame}
                        disabled={!hasSavedGame}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        {t.resumeGame}
                    </button>
                    <button 
                        onClick={() => handleStartNewGame(selectedDifficulty)}
                        className="w-full bg-white hover:bg-slate-100 text-slate-900 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <RotateCcw className="w-6 h-6" />
                        {t.newGame}
                    </button>
                </div>
           </div>
        </div>
      );
  }

  if (!game) return <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="bg-slate-800/80 backdrop-blur-md shadow-lg p-4 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <button 
                onClick={handleReturnToMenu}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-2"
                title={t.menu}
             >
                <Home className="w-5 h-5" />
             </button>
             <img src={LOGO_URL} alt="Esat Solitaire" className="w-8 h-8 rounded-lg shadow-sm hidden sm:block" />
             <div className="hidden sm:block">
                 <h1 className="text-xl font-bold text-white tracking-tight">{t.title}</h1>
                 <span className="text-xs text-slate-400 capitalize">
                   {game.difficulty === 'easy' ? t.diffEasy : game.difficulty === 'medium' ? t.diffMedium : t.diffHard}
                 </span>
             </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-mono text-sm">
             <div className="flex flex-col items-center">
                <span className="text-xs uppercase text-slate-500">{t.score}</span>
                <span className="font-bold text-white">{game.score}</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-xs uppercase text-slate-500">{t.moves}</span>
                <span className="font-bold text-white">{game.moves}</span>
             </div>
             <div className="flex flex-col items-center w-16">
                <span className="text-xs uppercase text-slate-500">{t.time}</span>
                <span className="font-bold text-white">
                  {Math.floor((Date.now() - (game.startTime || 0)) / 1000 / 60)}:
                  {String(Math.floor((Date.now() - (game.startTime || 0)) / 1000) % 60).padStart(2, '0')}
                </span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
                onClick={handleUndo}
                disabled={!previousState}
                className="p-2 rounded-full hover:bg-white/10 text-white disabled:text-slate-600 transition-colors"
                title={t.undo}
            >
                <Undo2 className="w-5 h-5" />
            </button>

            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                title={t.customize}
            >
                <Wand2 className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setMusicPlaying(!musicPlaying)}
                className={`p-2 rounded-full hover:bg-white/10 transition-colors ${musicPlaying ? 'text-green-400' : 'text-slate-400'}`}
                title={musicPlaying ? t.musicOn : t.musicOff}
            >
                {musicPlaying ? <Music className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button 
                onClick={() => handleStartNewGame(game.difficulty)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2"
            >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">{t.newGame}</span>
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="absolute top-20 right-4 z-30 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                {t.customize}
            </h3>
            <textarea 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                rows={3}
                placeholder={t.aiPromptPlaceholder}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt}
                className="w-full bg-purple-600 disabled:bg-slate-600 hover:bg-purple-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.generating}
                    </>
                ) : (
                    <>
                        <Wand2 className="w-4 h-4" />
                        {t.generate}
                    </>
                )}
            </button>
        </div>
      )}

      <main className="flex-1 overflow-auto p-4 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] bg-green-800 relative shadow-inner">
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
         
         <div className="max-w-7xl mx-auto h-full flex flex-col gap-8 relative z-10">
            
            {game.isWon && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                        <p className="text-slate-600 mb-6">You've mastered this deck in {game.moves} moves.</p>
                        <button 
                            onClick={() => handleStartNewGame(game.difficulty)}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 sm:gap-6">
                    <div 
                        className="relative w-[80px] h-[112px] sm:w-[100px] sm:h-[140px]"
                        onClick={handleStockClick}
                    >
                        {game.stock.length > 0 ? (
                            <div className="absolute inset-0 cursor-pointer hover:scale-105 transition-transform">
                                <div className="absolute inset-0 bg-blue-900 rounded-lg border-2 border-white/20 translate-x-1 translate-y-1" />
                                <div className="absolute inset-0 bg-blue-900 rounded-lg border-2 border-white/20 translate-x-0.5 translate-y-0.5" />
                                <PlayingCard card={game.stock[game.stock.length - 1]} customBackUrl={cardBackUrl} />
                            </div>
                        ) : (
                            <div className="w-full h-full rounded-lg border-2 border-white/10 bg-black/10 flex items-center justify-center">
                                <RotateCcw className="text-white/20 w-8 h-8" />
                            </div>
                        )}
                    </div>

                    <div className="relative w-[80px] h-[112px] sm:w-[100px] sm:h-[140px]">
                        {game.waste.map((card, idx) => (
                             <div 
                                key={card.id} 
                                className="absolute inset-0" 
                                style={{zIndex: idx}}
                            >
                                <PlayingCard 
                                    card={card} 
                                    draggable={idx === game.waste.length - 1}
                                    onDragStart={(e) => onDragStart(e, card, 'waste')}
                                    onDoubleClick={() => handleCardDoubleClick(card, 'waste')}
                                    customBackUrl={cardBackUrl}
                                />
                             </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-4">
                    {/* Render 4 Foundations */}
                    {[0, 1, 2, 3].map(pileIdx => {
                        const pile = game.foundations[pileIdx];
                        const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
                        return (
                            <div 
                                key={pileIdx}
                                className="w-[80px] h-[112px] sm:w-[100px] sm:h-[140px] rounded-lg border-2 border-white/20 bg-black/10 relative flex items-center justify-center"
                                onDragOver={allowDrop}
                                onDrop={(e) => onDropFoundation(e, pileIdx)}
                            >
                                {topCard ? (
                                    <PlayingCard 
                                        card={topCard} 
                                        draggable={true} 
                                        onDragStart={(e) => onDragStart(e, topCard, `foundation-${pileIdx}`)}
                                        onDoubleClick={() => handleCardDoubleClick(topCard, 'foundation')}
                                        customBackUrl={cardBackUrl}
                                    />
                                ) : (
                                    <span className="text-3xl opacity-20 font-bold text-white">A</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 flex-1">
                {game.tableau.map((column, colIdx) => (
                    <div 
                        key={colIdx} 
                        className="relative min-h-[200px]"
                        onDragOver={allowDrop}
                        onDrop={(e) => onDropTableau(e, colIdx)}
                    >
                        {column.length === 0 && (
                             <div className="w-full h-[112px] sm:h-[140px] rounded-lg border-2 border-dashed border-white/10" />
                        )}
                        {column.map((card, idx) => (
                            <div 
                                key={card.id}
                                className="absolute w-full"
                                style={{ 
                                    top: `${idx * (card.faceUp ? 25 : 10)}px`,
                                    zIndex: idx 
                                }}
                            >
                                <PlayingCard 
                                    card={card}
                                    draggable={card.faceUp}
                                    onDragStart={(e) => onDragStart(e, card, `tableau-${colIdx}`, idx)}
                                    onDoubleClick={() => handleCardDoubleClick(card, 'tableau', colIdx)}
                                    className={`h-[112px] sm:h-[140px]`}
                                    customBackUrl={cardBackUrl}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
         </div>
      </main>
    </div>
  );
}