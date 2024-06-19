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

    var isPlayerTurn = false;
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
        if (players.length === 0) {
            return;
        }

        let wasLastPlayer = false;
        if (currentPlayer === -1) {
            wasLastPlayer = true;
            currentPlayer = players.length - 1;
        }

    }

    async function newGame() {
        deck.current!.setDeck(pile);
        deck.current!.shuffle();
        players = [new Player("PLAYER", playerHand)];
        for (let i = 0; i < OPPONENT_COUNT; i++) {
            players.push(new Player(`OPPONENT ${i + 1}`, opponentHands!.current[i]));
        }

        for (let i = 0; i < players.length; i++) {
            for (let j = 0; j < STARTING_CARDS; j++) {
                players[i].managedDeck.current!.depositCard(deck.current!.drawCard()!);
                await sleep(50);
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

    return (
        <div className="PlayArea">
            <Dialog className='DialogBox' visible={!gameActive} onHide={newGame}>
                <h1>{gameMessage.head}</h1>
                <p>{gameMessage.body}</p>
                <Button label='OK' onClick={newGame}/>
            </Dialog>
            <div className='Deck-Collection'>
                <C.ManagedDrawPile ref={deck} engine={engine} name="Deck" initialDeck={pile} visibility={C.DeckVisibility.Hidden}/>
                {opponentHands!.current.map((hand, index) => <C.ManagedOpponentHand ref={hand} engine={engine} name={`OPPONENT ${index + 1}`} initialDeck={empty}/>)}
            </div>
            <div className='Hand-Collection'>
                <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={empty}/>
            </div>
            <Toast ref={toast} position='bottom-right'/>
        </div>
    );
}