import { useRef } from 'react';
import './App.css';

import * as C from './card-engine/CardEngine.Components';
import * as E from './card-engine/CardEngine';
import { PrimeReactProvider } from 'primereact/api';
import { Toast } from 'primereact/toast';

function App() {

  document.title = "Card Engine"
  let toast = useRef<Toast>(null);

  var engine = new E.Engine();
  let pile = E.getStandard52Deck();
  let empty = E.getEmptyDeck();
  pile.shuffle();
  let basic = pile.massDraw(1, 5)?.[0] ?? empty;

  let playerHand = useRef<C.ManagedHand>(null);
  let playPile = useRef<C.ManagedDeck>(null);
  let drawPile = useRef<C.ManagedDrawPile>(null);

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
            <C.ManagedDeck ref={playPile} engine={engine} name="Play Pile" initialDeck={empty} mode={C.DeckVisibility.TopOne}/>
            <C.ManagedDrawPile ref={drawPile} engine={engine} name="Draw Pile" initialDeck={pile} mode={C.DeckVisibility.Hidden} onDraw={(c) => playerHand.current?.depositCard(c)}/>
          </div>
          <div className='Hand-Collection'>
            <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={basic} onSelect={(card) => console.log(card.toString())}/>
          </div>
        </div>
      </div>
      <Toast ref={toast} position='bottom-right' />
    </PrimeReactProvider>
  );
}

export default App;
