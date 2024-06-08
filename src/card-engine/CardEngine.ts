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

export interface IManagedDeck {
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
