import './App.css';

import { PrimeReactProvider } from 'primereact/api';
import * as BJ from './blackjack/Blackjack';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';

document.title = "Card Games";

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

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const contentOnly = searchParams.get('contentOnly') === 'true';

  let topMenuItems = [
    { label: "Home", url: "/" }
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
          </footer>
        }
      </div>
    </PrimeReactProvider>    
  );
}

export default App;
