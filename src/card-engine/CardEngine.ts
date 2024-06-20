/**
 * Standard structures for a Card Game
 * Author: Aiden Bradley
 * MIT LICENSE
 */

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

export const suitNames = new Map<CardSuit, string>([
    [CardSuit.Hearts, "hearts"],
    [CardSuit.Diamonds, "diamonds"],
    [CardSuit.Clubs, "clubs"],
    [CardSuit.Spades, "spades"],
]);

export const valueNames = new Map<CardValue, string>([
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

export const pluralValueNames = new Map<CardValue, string>([
    [CardValue.Ace, "aces"],
    [CardValue.Two, "twos"],
    [CardValue.Three, "threes"],
    [CardValue.Four, "fours"],
    [CardValue.Five, "fives"],
    [CardValue.Six, "sixes"],
    [CardValue.Seven, "sevens"],
    [CardValue.Eight, "eights"],
    [CardValue.Nine, "nines"],
    [CardValue.Ten, "tens"],
    [CardValue.Jack, "jacks"],
    [CardValue.Queen, "queens"],
    [CardValue.King, "kings"],
]);

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

    isRed() : boolean {
        return this.suit === CardSuit.Diamonds || this.suit === CardSuit.Hearts;
    }

    id(hidden: boolean) : string {
        if (hidden) {
            return this.isRed() ? "2B" : "1B";
        }

        let valChar = '';
        switch (this.value) {
            case CardValue.Ace:
                valChar = 'A';
                break;
            case CardValue.Ten:
                valChar = 'T';
                break;
            case CardValue.Jack:
                valChar = 'J';
                break;
            case CardValue.Queen:
                valChar = 'Q';
                break;
            case CardValue.King:
                valChar = 'K';
                break;
            default:
                valChar = this.value.toString();
        }

        let suitChar = '';
        switch (this.suit) {
            case CardSuit.Clubs:
                suitChar = 'C';
                break;
            case CardSuit.Diamonds:
                suitChar = 'D';
                break;
            case CardSuit.Hearts:
                suitChar = 'H';
                break;
            case CardSuit.Spades:
                suitChar = 'S';
                break;
        }

        return valChar + suitChar;
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

    set list(value: PlayingCard[]) {
        this.cards = value;
    }

    shuffle() {
        this.cards.sort(() => Math.random() - 0.5);
    }

    sort() {
        this.cards.sort((a, b) => a.value - b.value)
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

    remove(card : PlayingCard) : boolean {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
            return true;
        }
        return false;
    }
}

export function getStandard52Deck() : Deck {
    let cards : PlayingCard[] = []; 
    for (let suit = 1; suit <= 4; suit++) {
        for (let value = CardValue.Ace; value <= CardValue.King; value++) {
            cards.push(new PlayingCard(suit, value));
        }
    }
    return new Deck(cards);
}

export function getEmptyDeck() : Deck {
    return new Deck([]);
}

export function getRandomCard() : PlayingCard {
    const suits = Object.values(CardSuit).filter(value => typeof value === 'string') as string[];
    const values = Object.values(CardValue).filter(value => typeof value === 'string') as string[];
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    return new PlayingCard(CardSuit[randomSuit as keyof typeof CardSuit], CardValue[randomValue as keyof typeof CardValue]);
}

export class Engine {
    private count = 0;
    private deckMap: Map<string, IManagedDeck> = new Map();
    private cardInPlay?: PlayingCard;
    private cardCallback?: () => boolean;

    turnTarget?: React.RefObject<IManagedDeck>;
    onFinishPlay? : () => void;
    
    assignDeck(newDeck: IManagedDeck) : string {
        let id = (this.count++).toString();
        this.deckMap.set(id, newDeck);
        return id;
    }

    startPlay(card: PlayingCard, callback: () => boolean) {
        if (this.isCardInPlay()) {
            return false;
        }
        this.cardInPlay = card;
        this.cardCallback = callback;

        if (this.turnTarget !== undefined && this.turnTarget.current != null) this.finishPlay(this.turnTarget.current);
        return true;
    }

    finishPlay(target: IManagedDeck) {
        if (this.cardInPlay !== undefined && this.cardCallback !== undefined) {
            if (this.cardCallback() && target.depositCard(this.cardInPlay)) {
                this.cardCallback = undefined;
                this.cardInPlay = undefined;
                this.turnTarget = undefined;
                if (this.onFinishPlay !== undefined) this.onFinishPlay();
                return true;   
            }
        }
        return false;
    }

    isCardInPlay = () => this.cardInPlay === null;
}

// only works with one normal 52 deck
export class BookManager {
    bookMap: Map<string, Set<CardValue>>;
    constructor(owners: string[]) {
        this.bookMap = new Map();
        owners.forEach(owner => {
            this.bookMap.set(owner, new Set);
        });
    }

    clone() {
        return { ...this } as BookManager;
    }

    fill(deck: Deck, owner: string) {
        deck = deck.clone();
        const valueCountMap: Map<CardValue, number> = new Map();

        for (const card of deck.list) {
            const currentCount = valueCountMap.get(card.value) || 0;
            valueCountMap.set(card.value, currentCount + 1);
        }

        const fullBooks: CardValue[] = [];
        for (const [value, count] of valueCountMap.entries()) {
            if (count === 1) {
                fullBooks.push(value);
            }
        }

        deck.list = deck.list.filter(c => fullBooks.includes(c.value));
        for (const full of fullBooks) {
            this.bookMap.get(owner)?.add(full);
        }

        return deck;
    }

    toString() {
        let s = "";
        for (const [owner, values] of this.bookMap.entries()) {
            s = s.concat(owner, ":\n");
            for (const value of values) {
                s = s.concat("\n - ", pluralValueNames.get(value)!, '\n');
            }
        }
        console.log(s);
        return s;
    }
}

export interface IManagedDeck {
    getDeck: () => Deck | undefined;
    setDeck: (deck: Deck) => void;
    id: string;
    drawCard?: () => PlayingCard | null;
    depositCard: (card: PlayingCard) => boolean;
    sort: () => void;
    shuffle: () => void;
}

export interface IPlayer {
    deck: IManagedDeck;
    beginTurn: () => void;
    onEndTurn: () => void;
    isGameOver: () => boolean;
}

export interface ICustomValue {
    getTotalValues: (cards: PlayingCard[]) => number[];
}
