import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import * as BJ from './blackjack/Blackjack';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Menu } from 'primereact/menu';

document.title = "Card Games";

const gameMenuItems = [
  { label: "Blackjack", url: `${process.env.PUBLIC_URL}/#blackjack` }
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
