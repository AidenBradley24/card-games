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

    const playerHand = useRef<C.ManagedHand>(null);
    const dealerHand = useRef<C.ManagedDeck>(null);
    const deck = useRef<C.ManagedDrawPile>(null);
    const money = useRef<C.ManagedMoney>(null);
    const [gameActive, setGameActive] = useState(false);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let menuItems = [ 
        { label: "Fold", command: () => console.log("fold") },
        { label: "Stand", command: () => console.log("stand") },
        { label: "Double Down", command: () => console.log("double") },
        { label: "Split", command: () => console.log("split") },
    ];

    async function newGame() {
        setGameActive(true);
        money.current?.createBet(startGame);     
    }

    async function startGame() {
        console.log("begin game");

        await sleep(1000);
        playerHand.current?.depositCard(deck.current?.drawCard()!);
        await sleep(500);
        playerHand.current?.depositCard(deck.current?.drawCard()!);
        await sleep(500);
        dealerHand.current?.depositCard(deck.current?.drawCard()!);
        await sleep(500);
        dealerHand.current?.depositCard(deck.current?.drawCard()!);
        dealerHand.current?.changeVisibility(C.DeckVisibility.TopTwoSecondHidden);
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
                <Menu model={menuItems}/>
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
    let best = 0;
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