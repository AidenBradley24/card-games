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

    const drawPile = useRef<C.ManagedDrawPile>(null);
    const [gameActive, setGameActive] = useState(false);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const [gameMessage, setGameMessage] = useState({ head: "GO FISH", body: "A simple card game where the goal is to get as many books of cards as possible." });
    const [bigMessage, setBigMessage] = useState("");

    var players : Player[] = [];
    const [playersDisplay, setPlayersDisplay] = useState<Player[]>([]);
    var currentPlayer = -1;
    const [currentPlayerDisplay, setCurrentPlayerDisplay] = useState(-1);

    const [bookManager, setBookManager] = useState<E.BookManager | null>(null);
    const [bookList, setBookList] = useState("books");

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
            if (this.managedDeck!.current instanceof C.ManagedOpponentHand) 
                return this.managedDeck!.current as C.ManagedOpponentHand;
            else
                return undefined;
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
        setCurrentPlayerDisplay(currentPlayer);
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
        runTurn(value);
    }

    async function runTurn(check: E.CardValue) {
        const player = playersDisplay[currentPlayerDisplay];
        const targetPlayer = playersDisplay[target];
        setTarget(-1);
        let deck = targetPlayer.managedDeck.current!.getDeck()!.clone();
        let playerDeck = player.managedDeck.current!.getDeck()!.clone();
        let matches : E.PlayingCard[] = [];
        for (let i = 0; i < deck.size; i++) {
            const card = deck.peek(i);
            if (check === card.value) matches.push(card);
        }

        await sleep(100);

        if (matches.length === 0) {
            toast.current?.show({ severity: "error", content: `${targetPlayer.myName} had no ${E.pluralValueNames.get(check)}!` });
            setBigMessage("GO FISH");
            await sleep(1000);
            setBigMessage("");

            const draw = drawPile.current!.drawCard();

            if (draw === null) {
                toast.current?.show({ severity: "error", content: `${targetPlayer.myName} is out of the game!` });
            }
            else {
                player.managedDeck.current!.depositCard(draw);
            }
        }
        else {
            toast.current?.show({ severity: "success", content: `${targetPlayer.myName} had ${matches.length}${matches.length === 1 ? E.valueNames.get(check) : E.pluralValueNames.get(check)}!` });
            matches.forEach((c) => {
                deck.remove(c);
                playerDeck.insertTop(c);
            });

            const opp = targetPlayer.opponentHand;
            if (opp !== undefined) {
                opp.showCards(matches);
            }

            setBigMessage("YES");
            await sleep(2000);
            setBigMessage("");

            targetPlayer.managedDeck.current!.setDeck(deck);
            player.managedDeck.current!.setDeck(playerDeck);
        }

        player.managedDeck.current!.setDeck(bookManager!.fill(player.managedDeck!.current!.getDeck()!, player.myName));
        setBookList(bookManager!.toString());

        await sleep(1000);
        nextTurn();
    } 

    async function newGame() {
        drawPile.current!.setDeck(pile);
        drawPile.current!.shuffle();
        let tempPlayers = [];
        tempPlayers.push(new Player("PLAYER", playerHand));
        for (let i = 0; i < OPPONENT_COUNT; i++) {
            tempPlayers.push(new Player(`OPPONENT ${i + 1}`, opponentHands!.current[i]));
        }
        players = tempPlayers;
        setPlayersDisplay(tempPlayers);

        for (let i = 0; i < tempPlayers.length; i++) {
            for (let j = 0; j < STARTING_CARDS; j++) {
                tempPlayers[i].managedDeck.current!.depositCard(drawPile.current!.drawCard()!);
                await sleep(10);
            }      
        }

        setBookManager(new E.BookManager(tempPlayers.map(p => p.myName)));

        setGameActive(true);
        startGame();
    }

    async function startGame() {
        toast.current?.show({ severity: "success", content: "Game started!" });   
        await sleep(500);
        currentPlayer = -1;
        nextTurn();
    }

    const cardValueTargets = Object.entries(E.CardValue).filter((e) => isNaN(Number(e[0]))).map((e) => {
        return { label: e[1] === 6 ? 'Sixes' : `${e[0]}s`, command: () => { playerSelect(e[1] as E.CardValue) }}
    });

    const booksPanel = (
        <div className='InfoPanel'>
            {
                bookList
            }
        </div>
    );

    return (
        <div className="PlayArea">
            { bigMessage?.length > 0 ? <C.BigMessage>{bigMessage}</C.BigMessage> : <></> }
            <Dialog className='DialogBox' visible={!gameActive} onHide={newGame}>
                <h1>{gameMessage.head}</h1>
                <p>{gameMessage.body}</p>
                <Button label='OK' onClick={newGame}/>
            </Dialog>
            <Dialog className='DialogBox' visible={isPlayerTurn && target !== -1} onHide={() => setTarget(-1)}>
                <h3>Does {playersDisplay[target]?.myName} have any...</h3>
                <Menu model={cardValueTargets} />
            </Dialog>
            <div className='Deck-Collection'>
                {booksPanel}
                <C.ManagedDrawPile ref={drawPile} engine={engine} name="Deck" initialDeck={pile} visibility={C.DeckVisibility.Hidden}/>
                {opponentHands!.current.map((hand, index) => 
                <C.ManagedOpponentHand key={index} ref={hand} engine={engine} name={`OPPONENT ${index + 1}`} initialDeck={empty} onClick={() => setTarget(index + 1)} isClickEnabled={isPlayerTurn && target === -1}/>
                )}
            </div>
            <div className='Hand-Collection'>
                <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={empty}/>
            </div>
            <Toast ref={toast} position='bottom-right'/>
        </div>
    );
}