import * as C from '../card-engine/CardEngine.Components';
import * as E from '../card-engine/CardEngine';
import '../card-engine/standard.css';

import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';

import { RefObject, useRef, createRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export const GoFish: React.FC = () => {
    document.title = "Go Fish"
    let toast = useRef<Toast>(null);

    var engine = new E.Engine();
    let pile = E.getStandard52Deck();
    let empty = E.getEmptyDeck();
    
    pile.shuffle();

    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [target, setTarget] = useState(-1);
    var turnNumber = 0;

    const OPPONENT_COUNT = 3;
    const STARTING_CARDS = 6;

    const playerHand = useRef<C.ManagedHand>(null);
    const opponentHands = useRef<RefObject<C.ManagedOpponentHand>[]>([]);
    if (opponentHands.current.length === 0) {
        for (let i = 0; i < OPPONENT_COUNT; i++) {
            opponentHands.current.push(createRef<C.ManagedOpponentHand>());
        }
    }

    const deck = useRef<C.ManagedDrawPile>(null);
    const [gameActive, setGameActive] = useState(false);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const [gameMessage, setGameMessage] = useState({ head: "GO FISH", body: "A simple card game where the goal is to get as many books of cards as possible." });

    var players : Player[] = [];
    var currentPlayer = -1;

    class Player {
        public managedDeck: RefObject<E.IManagedDeck>;
        private name: string;

        constructor(name: string, deck: RefObject<E.IManagedDeck>) {
            this.name = name;
            this.managedDeck = deck;
        }

        get myName() {
            return this.name;
        }

        get opponentHand() {
            return this.managedDeck!.current as C.ManagedOpponentHand;
        }
    }

    async function nextTurn() {
        turnNumber++;
        currentPlayer++;
        if (currentPlayer >= players.length) {
            currentPlayer = 0;
        }

        console.log(players);
        console.log(currentPlayer);
        
        if (players.length === 0) {
            return;
        } 

        let player = players[currentPlayer];
        toast.current?.show({ severity: "info", content: `${player.myName} turn!` });

        if (player.myName.startsWith("PLAYER")) {
            await playerTurn();
        }
        else {
            await opponentTurn();
        }
    }

    async function playerTurn() {
        setIsPlayerTurn(true);
        setTarget(-1);
    }

    async function opponentTurn() {

    }

    function playerSelect(value: E.CardValue) {
        console.log(`value ${value.toString()}`);
    }

    async function newGame() {
        deck.current!.setDeck(pile);
        deck.current!.shuffle();
        let tempPlayers = [];
        tempPlayers.push(new Player("PLAYER", playerHand));
        for (let i = 0; i < OPPONENT_COUNT; i++) {
            tempPlayers.push(new Player(`OPPONENT ${i + 1}`, opponentHands!.current[i]));
        }
        players = tempPlayers;

        for (let i = 0; i < tempPlayers.length; i++) {
            for (let j = 0; j < STARTING_CARDS; j++) {
                tempPlayers[i].managedDeck.current!.depositCard(deck.current!.drawCard()!);
                await sleep(10);
            }
        }

        setGameActive(true);
        await startGame();
    }

    async function startGame() {
        toast.current?.show({ severity: "success", content: "Game started!" });   
        await sleep(500);
        currentPlayer = -1;
        nextTurn();
    }

    const cardValueTargets = Object.keys(E.CardValue).filter((item) => {
        return isNaN(Number(item));
    }).map((s) => { return { label: s, command: () => { console.log(s); } } });

    console.log(isPlayerTurn);

    return (
        <div className="PlayArea">
            <Dialog className='DialogBox' visible={!gameActive} onHide={newGame}>
                <h1>{gameMessage.head}</h1>
                <p>{gameMessage.body}</p>
                <Button label='OK' onClick={newGame}/>
            </Dialog>
            <Dialog className='DialogBox' visible={isPlayerTurn && target !== -1} onHide={() => setTarget(-1)}>
                <h3>Does {players[currentPlayer]?.myName} have any...</h3>
                <Menu model={cardValueTargets} />
            </Dialog>
            <div className='Deck-Collection'>
                <C.ManagedDrawPile ref={deck} engine={engine} name="Deck" initialDeck={pile} visibility={C.DeckVisibility.Hidden}/>
                {opponentHands!.current.map((hand, index) => 
                <C.ManagedOpponentHand key={index} ref={hand} engine={engine} name={`OPPONENT ${index + 1}`} initialDeck={empty} onClick={() => setTarget(index)} isClickEnabled={isPlayerTurn && target === -1}/>
                )}
            </div>
            <div className='Hand-Collection'>
                <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={empty}/>
            </div>
            <Toast ref={toast} position='bottom-right'/>
        </div>
    );
}