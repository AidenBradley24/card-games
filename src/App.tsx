import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import * as BJ from './blackjack/Blackjack';
import { NavLink, Routes, Route } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';


const HomePage = () => (
  <div className='home'>
    <ul>
      <li><NavLink to='/blackjack'>Blackjack</NavLink></li>
    </ul>
  </div>
);

const BlackjackPage = () => (
  <BJ.BlackJack></BJ.BlackJack>
);

const Main = () => (
  <body>
    <Routes>
      <Route path='/' Component={HomePage}></Route>
      <Route path='/blackjack' Component={BlackjackPage}></Route>
    </Routes>  
  </body> 
)

function App() {

  let topMenuItems = [
    { label: "Home", url: "/" }
  ];
  
  return (
    <PrimeReactProvider>
      <div className="App">
        <header className="App-header">
          <Menubar className='topmenu' model={topMenuItems} start={<p>Card Games</p>}/>
        </header>
        <Main/>
        <footer className="App-footer">
        </footer>
      </div>
    </PrimeReactProvider>    
  );
}

export default App;
