import * as C from '../card-engine/CardEngine.Components';
import * as E from '../card-engine/CardEngine';

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
    console.log(value);
}