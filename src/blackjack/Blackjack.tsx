import * as C from '../card-engine/CardEngine.Components';
import * as E from '../card-engine/CardEngine';
import '../card-engine/standard.css';

import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';

import { useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export const BlackJack: React.FC = () => {
    document.title = "Blackjack"
    let toast = useRef<Toast>(null);

    var engine = new E.Engine();
    let pile = E.getStandard52Deck();
    let empty = E.getEmptyDeck();
    
    pile.shuffle();

    var isPlayerTurn = false;
    var turnNumber = 0;

    const playerHand = useRef<C.ManagedHand>(null);
    const dealerHand = useRef<C.ManagedDeck>(null);
    const handValue = new HandValue();
    const deck = useRef<C.ManagedDrawPile>(null);
    const money = useRef<C.ManagedMoney>(null);
    const [gameActive, setGameActive] = useState(false);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const drawCardPlayer = () => playerHand.current?.depositCard(deck.current?.drawCard()!);
    const drawCardDealer = () => dealerHand.current?.depositCard(deck.current?.drawCard()!);
    const getPlayerValue = () => beneficialValue(handValue.getTotalValues(playerHand.current?.getDeck().list!));
    const getDealerValue = () => beneficialValue(handValue.getTotalValues(dealerHand.current?.getDeck().list!));

    const [gameMessage, setGameMessage] = useState({ head: "BLACKJACK", body: "A race to get above the dealer's card value without exceeding 21.\nBet and try to get earn as much money as possible!" });

    var players : Player[] = [];
    var currentPlayer = -1;

    class Player {
        private name: string;
        private deck: E.Deck;
        private betId: number;

        constructor(name: string, deck: E.Deck, betId: number) {
            this.name = name;
            this.deck = deck;
            this.betId = betId;
        }

        get myDeck() {
            return this.deck;
        }

        set myDeck(deck: E.Deck) {
            this.deck = deck;
        }

        get myName() {
            return this.name;
        }

        get myBet() {
            return this.betId;
        }

        resolveBetAndRemove(multiplier: number) {
            money.current!.resolveBet(this.betId, multiplier);
            players.splice(players.findIndex(p => p === this), 1);
            currentPlayer--;
        }
    }

    function switchPlayer(nextPlayer: number) {
        if (currentPlayer < 0) {
            currentPlayer = players.length - 1;
        }
        if (nextPlayer < 0) {
            nextPlayer = 0;
        }
        players[currentPlayer].myDeck = playerHand.current!.getDeck();
        currentPlayer = nextPlayer;
        playerHand.current!.setDeck(players[currentPlayer].myDeck);
    }

    async function nextTurn() {

        turnNumber++;
        if (players.length === 0) {
            roundOver();
            return;
        }

        let wasLastPlayer = false;
        if (currentPlayer === -1) {
            wasLastPlayer = true;
            currentPlayer = players.length - 1;
        }

        if (getPlayerValue() > 21) {
            const player = players[currentPlayer];
            setGameMessage({ head: `${player.myName.toUpperCase()} BUSTS`, body: "(bet lost)" });
            toast.current?.show({ severity: "error", content: `${player.myName.toUpperCase()} busts!` });
            players[currentPlayer].resolveBetAndRemove(0);
            nextTurn();
            return;
        }

        const nextPlayer = wasLastPlayer ? 0 : currentPlayer + 1;
        if (nextPlayer >= players.length) {
            currentPlayer = -1;
            dealerTurn();
            return;
        }
        else {
            isPlayerTurn = true;
            switchPlayer(nextPlayer);
            updateCommands();
        }
    }

    //#region commands

    const hitCommand = { label: "Hit", command: async () => {
        isPlayerTurn = false;
        updateCommands();
        const player = players[currentPlayer];
        toast.current?.show({ severity: "info", content: `${player.myName} hits` });
        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        await nextTurn();
    }};

    const standCommand = { label: "Stand", command: async () => {
        isPlayerTurn = false;
        updateCommands();
        const player = players[currentPlayer];
        toast.current?.show({ severity: "info", content: `${player.myName} stands` });
        await sleep(500);
        await nextTurn();
    }};

    const doubleDownCommand = { label: "Double Down", command: async () => {
        const player = players[currentPlayer];
        if (money.current?.tryAdjustBet(players[currentPlayer].myBet, 2)) {
            toast.current?.show({ severity: "info", content: `${player.myName} doubles down!` });
        }
        else {
            toast.current?.show({ severity: "warn", content: "Can't afford double down!" });
            return;
        }
        isPlayerTurn = false;
        updateCommands();
        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        await nextTurn();
    }};

    const surrenderCommand = { label: "Surrender", command: async () => {
        isPlayerTurn = false;
        updateCommands();
        const player = players[currentPlayer];
        toast.current?.show({ severity: "error", content: `${player.myName} surrenders!` });
        await sleep(500);
        player.resolveBetAndRemove(0.5);
        setGameMessage({ head: "SURRENDER", body: "(Half of bet returned)" });
        nextTurn();
    }};

    const splitCommand = { label: "Split", command: async () => {
        const player = players[currentPlayer];
        toast.current?.show({ severity: "info", content: `${player.myName} splits` });
        const betValue = money.current!.getBetValue(player.myBet)!;
        const newBet = money.current!.createBetWithValue(betValue);
        if (newBet === undefined) {
            toast.current?.show({ severity: "warn", content: "Can't afford new bet!" });
            return;
        }
        isPlayerTurn = false;
        updateCommands();
        const [d1, d2] = player.myDeck.split(2)!;
        player.myDeck = d1; 
        const newPlayer = new Player(`${player.myName} (SPLIT)`, d2, newBet);
        const newPlayerId = players.length;
        players.push(newPlayer);
        await sleep(500);
        playerHand.current!.setDeck(player.myDeck);
        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        switchPlayer(newPlayerId);
        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        nextTurn();
    }};

    const [commands, setCommands] = useState<any[]>();

    function updateCommands() {
        let menuItems = [hitCommand, standCommand];
        let cards = playerHand.current?.getDeck()?.list;

        if (!isPlayerTurn || cards === undefined || cards.length < 2) {
            setCommands(undefined);
            return;
        }

        toast.current?.show({ severity: "info", content: `${players[currentPlayer]?.myName} turn!` });

        let valueOptions = handValue.getTotalValues(cards);
        if (valueOptions.includes(9) || valueOptions.includes(10) || valueOptions.includes(11)) {
            menuItems.push(doubleDownCommand);
        }
        if (cards.length === 2 && cards[0].value === cards[1].value) {
            menuItems.push(splitCommand);
        }
        if (turnNumber > 1) {
            menuItems.push(surrenderCommand);
        }
        
        setCommands(menuItems);
    }


//#endregion

    function roundOver() {
        setGameActive(false);
        isPlayerTurn = false;
        updateCommands();
    }
    
    async function dealerTurn() {
        dealerHand.current?.changeVisibility(C.DeckVisibility.TopTwoFlipped);
        await sleep(2000);
        dealerHand.current?.changeVisibility(C.DeckVisibility.TopTwoFirstHidden);

        let dealerValue = getDealerValue();

        if (dealerValue <= 16) {
            drawCardDealer();
            toast.current?.show({ severity: "info", content: "DEALER draws" });
        } else {
            toast.current?.show({ severity: "info", content: "DEALER stands" });
        }

        dealerValue = getDealerValue();

        if (dealerValue > 21) {
            setGameMessage({ head: `DEALER busts!`, body: "(bets won!)" });
            toast.current?.show({ severity: "success", content: `DEALER busts!` });
            players.forEach(p => {
                p.resolveBetAndRemove(2);
            });
            roundOver();
            return;
        }

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const playerValue = beneficialValue(handValue.getTotalValues(player.myDeck.list!));
            if (playerValue === dealerValue) {
                setGameMessage({ head: "PUSH", body: "(bet returned)" });
                toast.current?.show({ severity: "warn", content: `PUSH` });
                player.resolveBetAndRemove(1);
                nextTurn();
                return;
            }
            else if (playerValue > dealerValue) {
                setGameMessage({ head: "EXCEEDED DEALER VALUE", body: "(bet won!)" });
                toast.current?.show({ severity: "success", content: `DEALER exceeded!` });
                player.resolveBetAndRemove(2);
                nextTurn();
                return;
            }
        }

        currentPlayer = -1;
        nextTurn();
    }

    async function newGame() {
        playerHand.current?.setDeck(empty);
        dealerHand.current?.setDeck(empty);
        deck.current?.setDeck(pile);
        setGameActive(true);
        money.current?.createBet(startGame);     
    }

    async function startGame(playerBetId: number) {
        toast.current?.show({ severity: "success", content: "Game started!" });
        await sleep(1000);
        drawCardPlayer();
        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        drawCardDealer();
        await sleep(500);
        drawCardDealer();
        dealerHand.current?.changeVisibility(C.DeckVisibility.TopTwoFirstHidden);
        await sleep(500);
        players = [new Player("PLAYER", playerHand.current!.getDeck(), playerBetId)];
        switchPlayer(0);
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
                <C.ManagedDeck ref={dealerHand} engine={engine} name="Dealer" initialDeck={empty} visibility={C.DeckVisibility.Hidden}/>
                <C.ManagedDrawPile ref={deck} engine={engine} name="Deck" initialDeck={pile} visibility={C.DeckVisibility.Hidden}/>
                <Menu model={commands}/>
                <C.ManagedMoney ref={money} startingMoney={1000} minBet={1} maxBet={100000000}/>
            </div>
            <div className='Hand-Collection'>
                <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={empty}/>
            </div>
            <Toast ref={toast} position='bottom-right'/>
        </div>
    );
}

function beneficialValue(values: number[]) {
    let best = values[0];
    values.forEach(value => {
        if (value === 21) return 21;
        if (value > best && value < 21 || best > 21) best = value;
    });
    return best;
}


class HandValue implements E.ICustomValue {
    getTotalValues = (cards: E.PlayingCard[]) => {
        /* Each ace can be either 1 or 11*/
        let aceCount = 0;
        let baseValueTotal = 0;
        cards.forEach(card => {
            switch (card.value) {
                case E.CardValue.Ace:
                    aceCount++;
                    break;
                case E.CardValue.Jack:
                case E.CardValue.Queen:
                case E.CardValue.King:
                    baseValueTotal += 10;
                    break;
                default:
                    baseValueTotal += card.value;
                    break;
            }
        });

        let totalValues: number[] = [];
        for (let i = 0; i <= aceCount; i++) {
            totalValues.push(baseValueTotal + i + 11 * (aceCount - i));
        }

        return totalValues;
    }
}

export function test() {
    let valueGetter = new HandValue();
    let cards = [new E.PlayingCard(E.CardSuit.Clubs, E.CardValue.Ace), new E.PlayingCard(E.CardSuit.Diamonds, E.CardValue.Ace)];
    let value = valueGetter.getTotalValues(cards);
    valueGetter.getTotalValues(cards)
    console.log(value);
}