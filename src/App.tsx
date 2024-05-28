import React, {useState} from 'react';
import './App.css';

import { RenderedDeck, RenderedPlayingCard, DeckMode } from './CardRenderer';
import CardEngine from './CardEngine';

function App() {

  let pile = CardEngine.getStandard52();

  document.title = "Card Engine"

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Card Engine
        </p>
      </header>
      <div className="PlayArea">
        <RenderedDeck name="Draw Pile" initialDeck={pile} mode={DeckMode.TopOne}/>
      </div>

    </div>
  );
}

export default App;
