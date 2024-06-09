import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import * as BJ from './blackjack/Blackjack';

function App() {

  return (
    <PrimeReactProvider>
      <div className="App">
        <header className="App-header">
          <p>
            Card Engine
          </p>
        </header>
        <BJ.BlackJack></BJ.BlackJack>
      </div>
    </PrimeReactProvider>
  );
}

export default App;
