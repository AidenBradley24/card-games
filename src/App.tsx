import React, {useState} from 'react';
import './App.css';

import { RenderedDeck, RenderedPlayingCard, DeckMode, DrawPile, Hand } from './CardRenderer';
import CardEngine from './CardEngine';

function App() {

  let pile = CardEngine.getStandard52Deck();
  let empty = CardEngine.getEmptyDeck();
  pile.shuffle();
  let basic = pile.massDraw(1, 5)?.[0] ?? empty;

  document.title = "Card Engine"

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Card Engine
        </p>
      </header>
      <div className="PlayArea">
        <div className='Deck-Collection'>
        <RenderedDeck name="Hand" initialDeck={empty} mode={DeckMode.TopOne}/>
        <DrawPile name="Draw Pile" initialDeck={pile} mode={DeckMode.TopOne} onDraw={(card) => console.log(card.toString())}></DrawPile>
        </div>
        <Hand name="Hand" initialDeck={basic} onSelect={(card) => console.log(card.toString())}></Hand>
      </div>

    </div>
  );
}

export default App;
