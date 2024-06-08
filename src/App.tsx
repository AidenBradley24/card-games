import React, {useRef, useState} from 'react';
import './App.css';

import { ManagedDeck, RenderedPlayingCard, DeckVisibility, ManagedDrawPile, ManagedHand } from './CardRenderer';
import CardEngine from './CardEngine';
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import { Toast } from 'primereact/toast';


function App() {

  document.title = "Card Engine"
  let toast = useRef<Toast>(null);

  var engine = new CardEngine.Engine();
  let pile = CardEngine.getStandard52Deck();
  let empty = CardEngine.getEmptyDeck();
  pile.shuffle();
  let basic = pile.massDraw(1, 5)?.[0] ?? empty;

  let playerHand = useRef<ManagedHand>(null);
  let playPile = useRef<ManagedDeck>(null);
  let drawPile = useRef<ManagedDrawPile>(null);

  engine.turnTarget = playPile;
  engine.onFinishPlay = () => {
    engine.turnTarget = playPile;
    console.log("finish play");
    toast.current?.show({content: 'Your Turn'})
  }

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
            <ManagedDeck ref={playPile} engine={engine} name="Play Pile" initialDeck={empty} mode={DeckVisibility.TopOne}/>
            <ManagedDrawPile ref={drawPile} engine={engine} name="Draw Pile" initialDeck={pile} mode={DeckVisibility.Hidden} onDraw={(c) => playerHand.current?.depositCard(c)}></ManagedDrawPile>
          </div>
          <div className='Hand-Collection'>
            <ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={basic} onSelect={(card) => console.log(card.toString())}></ManagedHand>
          </div>
        </div>
      </div>
      <Toast ref={toast} position='bottom-right' />
    </PrimeReactProvider>
  );
}

export default App;
