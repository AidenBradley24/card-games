import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import * as BJ from './blackjack/Blackjack';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { Menu } from 'primereact/menu';

document.title = "Card Games";

const gameMenuItems = [
  { label: "Blackjack", url: '/#blackjack' }
];

const HomePage = () => (
  <div className='home'>
    <Menu model={gameMenuItems}/>
  </div>
);

const BlackjackPage = () => (
  <BJ.BlackJack></BJ.BlackJack>
);

const Main = () => (
  <div className='content'>
    <Routes>
      <Route path='/' Component={HomePage}></Route>
      <Route path='/blackjack' Component={BlackjackPage}></Route>
    </Routes>  
  </div> 
)

function App() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const contentOnly = searchParams.get('contentOnly') === 'true';

  let topMenuItems = [
    { label: "Home", url: "/#" }
  ];
  
  return (
    <PrimeReactProvider>
      <div className="App">
        {
          !contentOnly &&
          <header className="App-header">
            <Menubar className='topmenu' model={topMenuItems} start={<p>Card Games</p>}/>
          </header>
        }
        <Main/>
        {
          !contentOnly &&
          <footer className="App-footer">
            Created by Aiden Bradley
            <br></br>
            MIT LICENSE
          </footer>
        }
      </div>
    </PrimeReactProvider>    
  );
}

export default App;
