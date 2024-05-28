import React, {useState} from 'react';
import './App.css';

import { RenderedDeck, RenderedPlayingCard, DeckMode, DrawPile } from './CardRenderer';
import CardEngine from './CardEngine';

function App() {

  let pile = CardEngine.getStandard52Deck();
  let empty = CardEngine.getEmptyDeck();
  pile.shuffle();
  
  document.title = "Card Engine"

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Card Engine
        </p>
      </header>
      <div className="PlayArea">
        <RenderedDeck name="Hand" initialDeck={empty} mode={DeckMode.TopOne}/>
        <DrawPile name="Draw Pile" initialDeck={pile} mode={DeckMode.TopOne}></DrawPile>
      </div>

    </div>
  );
}

export default App;
