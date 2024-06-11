import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import * as BJ from './blackjack/Blackjack';

function App() {

  return (
    <PrimeReactProvider>
      <div className="App">
        <header className="App-header">
          <p>
            Blackjack
          </p>
        </header>
        <BJ.BlackJack></BJ.BlackJack>
        <footer className="App-footer">

        </footer>
      </div>
    </PrimeReactProvider>
  );
}

export default App;
