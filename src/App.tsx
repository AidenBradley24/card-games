import React, {useRef, useState} from 'react';
import './App.css';

import { ManagedDeck, RenderedPlayingCard, DeckMode, ManagedDrawPile, ManagedHand } from './CardRenderer';
import CardEngine from './CardEngine';
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';

function App() {

  document.title = "Card Engine"
  var engine = new CardEngine.Engine();
  let hand = useRef<ManagedHand>(null);
  engine.defaultTarget = hand;
  let pile = CardEngine.getStandard52Deck();
  let empty = CardEngine.getEmptyDeck();
  pile.shuffle();
  let basic = pile.massDraw(1, 5)?.[0] ?? empty;

  return (
    <PrimeReactProvider>
      <div className="App">
        <header className="App-header">
          <p>
            Card Engine
          </p>
        </header>
        <div className="PlayArea">
          <div className='Deck-Collection'>
          <ManagedDeck engine={engine} name="Hand" initialDeck={empty} mode={DeckMode.TopOne}/>
          <ManagedDrawPile engine={engine} name="Draw Pile" initialDeck={pile} mode={DeckMode.TopOne} onDraw={(card) => console.log(card.toString())}></ManagedDrawPile>
          </div>
          <ManagedHand ref={hand} engine={engine} name="Hand" initialDeck={basic} onSelect={(card) => console.log(card.toString())}></ManagedHand>
        </div>
      </div>
    </PrimeReactProvider>   
  );
}

export default App;
