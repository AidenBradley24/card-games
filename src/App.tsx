import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Menu } from 'primereact/menu';

import * as BJ from './games/Blackjack';
import * as FISH from './games/GoFish';

document.title = "Card Games";

const HomePage = () => (
  <div className='home'>
    <Menu model={gameMenuItems}/>
  </div>
);

const gameMenuItems = [
  { label: "Blackjack", url: `${process.env.PUBLIC_URL}/#blackjack` },
  { label: "Go Fish", url: `${process.env.PUBLIC_URL}/#go-fish` }
];

const BlackjackPage = () => (
  <BJ.BlackJack/>
);

const GoFishPage = () => (
  <FISH.GoFish/>
);

const Main = () => (
  <div className='content'>
    <Routes>
      <Route path='/' Component={HomePage}></Route>
      <Route path='/blackjack' Component={BlackjackPage}></Route>
      <Route path='/go-fish' Component={GoFishPage}></Route>
    </Routes>  
  </div> 
)

function App() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const contentOnly = searchParams.get('contentOnly') === 'true';
  
  return (
    <PrimeReactProvider>
      <div className="App">
        {
          !contentOnly &&
          <header className="App-header">
            <a className='title' href={`${process.env.PUBLIC_URL}/#`}>Card Games</a>
            <span className='vl'>|</span>
            <a className='toplink' href={'/'}>Home</a>
            <div className="copyright">
              <a className='footer-text' href='https://github.com/AidenBradley24'>Created by Aiden Bradley</a> 
              <a className='footer-text' href='https://github.com/AidenBradley24/card-games/blob/master/LICENSE'>MIT LICENSE</a>    
            </div>
          </header>
        }
        <Main/>
      </div>
    </PrimeReactProvider>    
  );
}

export default App;
