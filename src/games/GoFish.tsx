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

    var turnNumber = 0;

    var [isPlayerTurn, setIsPlayerTurn] = useState(false);
    var [target, setTargetDisplay] = useState(-1);
    var [players, setPlayersDisplay] = useState<Player[]>([]);
    var [currentPlayer, setCurrentPlayerDisplay] = useState(-1);
    var [activePlayers, setActivePlayersDisplay] = useState<number[]>([])
    const bookDisplay = useRef<C.ManagedBookDisplay>(null);

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

    function finishedGame() {
        const winner = bookDisplay.current!.scores[0];
        setGameMessage({
            head: "GAME OVER",
            body: `The winner is ${winner.name} with ${winner.score} books!`
        });
        setGameActive(false);
    }

    async function nextTurn(incrementPlayer: boolean) {

        if (activePlayers.length === 0) {
            finishedGame();
            return;
        }

        while (incrementPlayer || !activePlayers.includes(currentPlayer)) {
            incrementPlayer = false;
            currentPlayer++;
            if (currentPlayer >= players.length) {
                currentPlayer = 0;
            }
        }

        setCurrentPlayerDisplay(currentPlayer);
        turnNumber++;

        await sleep(500);

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
        setTargetDisplay(-1);
    }

    async function opponentTurn() {
        setIsPlayerTurn(false);
        const myTarget = players.reduce((prev, current) => {
            const prevVal = prev.managedDeck.current!.getDeck()?.size!;
            const currentVal = current.managedDeck.current!.getDeck()?.size!;
            if (prev === players[currentPlayer]) return current;
            if (current === players[currentPlayer]) return prev;
            return (prevVal > currentVal) ? prev : current;
        });
        target = players.indexOf(myTarget);
        setTargetDisplay(target);
        const myHand = players[currentPlayer].managedDeck.current!.getDeck()!;
        const targetValue = myHand.size === 0 ? E.randomCardValue() : myHand.list[Math.floor(Math.random() * myHand.size)].value;
        runTurn(targetValue);
    }

    function playerSelect(value: E.CardValue) {
        runTurn(value);
    }

    async function runTurn(check: E.CardValue) {
        setIsPlayerTurn(false);
        const player = players[currentPlayer];
        const targetPlayer = players[target];
        setTargetDisplay(-1);
        let targetDeck = targetPlayer.managedDeck.current!.getDeck()!.clone();
        let playerDeck = player.managedDeck.current!.getDeck()!.clone();
        let matches : E.PlayingCard[] = [];

        for (let i = 0; i < targetDeck.size; i++) {
            const card = targetDeck.peek(i);
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
                toast.current?.show({ severity: "error", content: `${player.myName} is out of the game!` });
                activePlayers.splice(activePlayers.indexOf(currentPlayer), 1);
            }
            else {
                playerDeck.insertTop(draw);
            }
        }
        else {
            toast.current?.show({ severity: "success", content: `${targetPlayer.myName} had ${matches.length} ${matches.length === 1 ? E.valueNames.get(check) : E.pluralValueNames.get(check)}!` });
            matches.forEach((c) => {
                targetDeck.remove(c);
                playerDeck.insertTop(c);
            });

            const opp = targetPlayer.opponentHand;
            if (opp !== undefined) {
                opp.showCards(matches);
            }

            setBigMessage("YES");
            await sleep(2000);
            setBigMessage("");
        }

        playerDeck = bookDisplay.current!.fill(playerDeck, player.myName);
        targetPlayer.managedDeck.current!.setDeck(targetDeck);
        player.managedDeck.current!.setDeck(playerDeck);

        await sleep(1000);
        players[target] = targetPlayer;
        players[currentPlayer] = player;
        setPlayersDisplay([...players]);
        setCurrentPlayerDisplay(currentPlayer);
        setActivePlayersDisplay(activePlayers);
        nextTurn(matches.length === 0);
    }

    async function bookCompleteMessage(owner: string, book: E.CardValue) {
        toast.current?.show({ severity: "success", content: `${owner} has completed the ${E.pluralValueNames.get(book)}!` });
    }

    async function newGame() {
        drawPile.current!.setDeck(pile);
        drawPile.current!.shuffle();
        players = [];
        players.push(new Player("PLAYER", playerHand));
        for (let i = 0; i < OPPONENT_COUNT; i++) {
            players.push(new Player(`OPPONENT ${i + 1}`, opponentHands!.current[i]));
        }
        setPlayersDisplay(players);
        activePlayers = Array.from(Array(players.length), (_, index) => index);
        setActivePlayersDisplay(activePlayers);

        for (let i = 0; i < players.length; i++) {
            for (let j = 0; j < STARTING_CARDS; j++) {
                players[i].managedDeck.current!.depositCard(drawPile.current!.drawCard()!);
                await sleep(10);
            }      
        }

        bookDisplay.current!.init();
        
        // initial book check
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            player.managedDeck.current!.setDeck(bookDisplay.current!.fill(player.managedDeck!.current!.getDeck()!, player.myName));
        }

        setGameActive(true);
        startGame();
    }

    async function startGame() {
        toast.current?.show({ severity: "success", content: "Game started!" });   
        await sleep(500);
        currentPlayer = -1;
        nextTurn(true);
    }

    const cardValueTargets = Object.entries(E.CardValue).filter((e) => isNaN(Number(e[0]))).map((e) => {
        return { label: e[1] === 6 ? 'Sixes' : `${e[0]}s`, command: () => { playerSelect(e[1] as E.CardValue) }}
    });

    return (
        <div className="PlayArea">
            { bigMessage?.length > 0 && isPlayerTurn ? <C.BigMessage>{bigMessage}</C.BigMessage> : <></> }
            <Dialog className='DialogBox' visible={!gameActive} onHide={newGame}>
                <h1>{gameMessage.head}</h1>
                <p>{gameMessage.body}</p>
                <Button label='OK' onClick={newGame}/>
            </Dialog>
            <Dialog className='DialogBox' visible={isPlayerTurn && target !== -1} onHide={() => setTargetDisplay(-1)}>
                <h3>Does {players[target]?.myName} have any...</h3>
                <Menu model={cardValueTargets} />
            </Dialog>
            <div className='Deck-Collection'>
                <C.ManagedBookDisplay ref={bookDisplay} title='Books' owners={players.map(p => p.myName)} onFillBook={bookCompleteMessage}/>
                <C.ManagedDrawPile ref={drawPile} engine={engine} name="Deck" initialDeck={pile} visibility={C.DeckVisibility.Hidden}/>
                {opponentHands!.current.map((hand, index) => 
                <C.ManagedOpponentHand key={index} ref={hand} engine={engine} name={`OPPONENT ${index + 1}`} initialDeck={empty} onClick={() => setTargetDisplay(index + 1)} isClickEnabled={isPlayerTurn && target === -1}/>
                )}
            </div>
            <div className='Hand-Collection'>
                <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={empty}/>
            </div>
            <Toast ref={toast} position='bottom-right'/>
        </div>
    );
}