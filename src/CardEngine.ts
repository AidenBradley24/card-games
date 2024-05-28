export namespace CardEngine {

    export class PlayingCard {
        suit: CardSuit;
        value: CardValue;
    
        constructor(suit : CardSuit, value : CardValue) {
            this.suit = suit;
            this.value = value;
        }
    
        toString() : string {
            return valueNames.get(this.value) + " of " + suitNames.get(this.suit);
        }

        compareTo(other : PlayingCard) : number {
            let offset = this.value - other.value;
            return offset;
        }
    }

    export class Deck {
        private cards : Array<PlayingCard>;
    
        constructor(list : Array<PlayingCard>) {
            this.cards = list;
        }
    
        get list(): PlayingCard[] {
            return this.cards;
        }
    
        shuffle() {
            this.cards.sort(() => Math.random() - 0.5);
        }
    
        draw() : PlayingCard | null {
            return this.cards.pop() ?? null;
        }
    
        insertTop(card : PlayingCard) {
            this.cards.push(card);
        }
    
        peek(offset = 0) {
            return this.cards[this.cards.length - offset - 1];
        }

        get size() {
            return this.cards.length;
        }
    
        clone() : Deck {
            return new Deck([...this.cards]);
        }

        split(splitCount : number) : Deck[] | null {
            return this.massDraw(splitCount, Math.ceil(this.cards.length / splitCount));
        }

        massDraw(splitCount : number, targetSize : number, isStrict = false) : Deck[] | null {
            let decks = [];
            for (let i = 0; i < splitCount; i++) {
                if(isStrict && this.cards.length < targetSize) {
                    return null;
                }
                let section = this.cards.splice(0, targetSize);
                decks.push(new Deck(section));
            }
            return decks;
        }
    }
    
    export function getStandard52() : Deck {
        let cards : PlayingCard[] = []; 
        for (let suit = 1; suit <= 4; suit++) {
            for (let value = CardValue.Ace; value <= CardValue.King; value++) {
                cards.push(new PlayingCard(suit, value));
            }
        }
        return new Deck(cards);
    }

    export function getRandomCard() : CardEngine.PlayingCard {
        const suits = Object.values(CardSuit).filter(value => typeof value === 'string') as string[];
        const values = Object.values(CardValue).filter(value => typeof value === 'string') as string[];
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const randomValue = values[Math.floor(Math.random() * values.length)];
        return new PlayingCard(CardSuit[randomSuit as keyof typeof CardSuit], CardValue[randomValue as keyof typeof CardValue]);
    }

    export enum CardSuit {
        Hearts = 1,
        Diamonds,
        Clubs,
        Spades,
    }
    
    export enum CardValue {
        Ace = 1,
        Two,
        Three,
        Four,
        Five,
        Six,
        Seven,
        Eight,
        Nine,
        Ten,
        Jack,
        Queen,
        King
    }

    export enum ValueRule {
        HighAce,
        LowAce,
        DuelAce
    }
    
    const suitNames = new Map<CardSuit, string>([
        [CardSuit.Hearts, "hearts"],
        [CardSuit.Diamonds, "diamonds"],
        [CardSuit.Clubs, "clubs"],
        [CardSuit.Spades, "spades"],
    ]);
    
    const valueNames = new Map<CardValue, string>([
        [CardValue.Ace, "ace"],
        [CardValue.Two, "two"],
        [CardValue.Three, "three"],
        [CardValue.Four, "four"],
        [CardValue.Five, "five"],
        [CardValue.Six, "six"],
        [CardValue.Seven, "seven"],
        [CardValue.Eight, "eight"],
        [CardValue.Nine, "nine"],
        [CardValue.Ten, "ten"],
        [CardValue.Jack, "jack"],
        [CardValue.Queen, "queen"],
        [CardValue.King, "king"],
    ]);
}

export default CardEngine;