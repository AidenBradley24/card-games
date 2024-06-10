import * as C from '../card-engine/CardEngine.Components';
import * as E from '../card-engine/CardEngine';
import '../card-engine/standard.css';

import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';

import { useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';

export const BlackJack: React.FC = () => {document.title = "Card Engine"
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

    const hitCommand = { label: "Hit", command: async () => {
        isPlayerTurn = false;
        updateCommands();
        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        await dealerTurn();
    }};
    const standCommand = { label: "Stand", command: async () => {
        isPlayerTurn = false;
        updateCommands();
        await sleep(500);
        await dealerTurn();
    }};
    const doubleDownCommand = { label: "Double Down", command: async () => {
        isPlayerTurn = false;
        updateCommands();

        if (money.current?.tryAdjustBet(0, 2)) {
            console.log("DOUBLE DOWN");
        }

        await sleep(500);
        drawCardPlayer();
        await sleep(500);
        await dealerTurn();
    }};
    const splitCommand = { label: "Split", command: async () => console.log("split") };

    const [commands, setCommands] = useState<any[]>();

    function updateCommands() {
        let menuItems = [hitCommand, standCommand];
        let cards = playerHand.current?.getDeck()?.list;

        if (!isPlayerTurn || cards === undefined || cards.length < 2) {
            setCommands(undefined);
            return;
        }

        let valueOptions = handValue.getTotalValues(cards);
        if (valueOptions.includes(9) || valueOptions.includes(10) || valueOptions.includes(11)) {
            menuItems.push(doubleDownCommand);
        }
        if (turnNumber === 0 && cards[0].value === cards[1].value) {
            menuItems.push(splitCommand);
        }
        
        setCommands(menuItems);
    }

    async function dealerTurn() {
        let playerValue = getPlayerValue();

        if (playerValue > 21) {
            console.log("player loses!");
            money.current?.resolveBet(0, 0);
            return;
        }

        dealerHand.current?.changeVisibility(C.DeckVisibility.TopTwoFlipped);
        await sleep(2000);
        dealerHand.current?.changeVisibility(C.DeckVisibility.TopTwoFirstHidden);

        let dealerValue = getDealerValue();

        if (dealerValue > 21) {
            console.log("player wins!");
            return;
        }

        if (dealerValue <= 16) {
            drawCardDealer();
        }

        if (playerValue === dealerValue) {
            console.log("push");
            money.current?.resolveBet(0, 1);
            return;
        }
        else if (playerValue > dealerValue) {
            console.log("player wins!");
            money.current?.resolveBet(0, 2);
            return;
        }

        isPlayerTurn = true;
        updateCommands();
    }

    async function newGame() {
        setGameActive(true);
        money.current?.createBet(startGame);     
    }

    async function startGame() {
        console.log("begin game");

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
        isPlayerTurn = true;
        updateCommands();
    }

    return (
        <div className="PlayArea">
            <Dialog visible={!gameActive} onHide={newGame}>
                <h1>Blackjack</h1>
                <p>
                    Close to begin the game!
                </p>
            </Dialog>
            <div className='Deck-Collection'>
                <C.ManagedDeck ref={dealerHand} engine={engine} name="Dealer" initialDeck={empty} visibility={C.DeckVisibility.Hidden}/>
                <C.ManagedDrawPile ref={deck} engine={engine} name="Deck" initialDeck={pile} visibility={C.DeckVisibility.Hidden}/>
                <Menu model={commands}/>
                <C.ManagedMoney ref={money} startingMoney={1000} minBet={2} maxBet={200}/>
            </div>
            <div className='Hand-Collection'>
                <C.ManagedHand ref={playerHand} engine={engine} name="Hand" initialDeck={empty} onSelect={(card) => console.log(card.toString())}/>
            </div>
            <Toast ref={toast} position='bottom-right'/>
        </div>
    );
}

function beneficialValue(values: number[]) {
    let best = values[0];
    values.forEach(value => {
        if (value === 21) return 21;
        if (value > best && value < 21) best = value;
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