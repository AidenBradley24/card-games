/**
 * Standard components for a Card Game using React.js
 * Author: Aiden Bradley
 * MIT LICENSE
 */


import * as CardEngine from './CardEngine';

import React, {createRef} from 'react';
import { ContextMenu } from 'primereact/contextmenu'

import './components.css'
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';

import { Carousel } from 'primereact/carousel';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { FloatLabel } from 'primereact/floatlabel';

export const RenderedPlayingCard: React.FC<IRenderedPlayingCardProps> = ({ card, hidden }) => {
    if (card === null || card === undefined) return <></>;
    return (
        <img className="PlayingCard" src={`${process.env.PUBLIC_URL}/card_graphics/` + card.id(hidden) + '.svg'} alt={hidden ? `hidden ${card.isRed() ? 'red' : 'black'} card` : card.toString()}/>
    );
}

export const RenderedPlayingCardPlaceholder: React.FC = () => {
    return (
        <div className='PlayingCardPlaceholder'></div>
    );
}

interface ICommonProps {
    name: string;
    engine: CardEngine.Engine;
    onClick?: () => void;
    isClickEnabled?: boolean;
}

interface ICommonState {
}

interface IRenderedPlayingCardProps {
    card: CardEngine.PlayingCard;
    hidden: boolean;
}

export enum DeckVisibility {
    Hidden,
    TopOne,
    TopTwo,
    TopTwoSecondHidden,
    TopTwoFirstHidden,
    TopTwoFlipped
}
    
interface IManagedDeckProps extends ICommonProps {
    initialDeck: CardEngine.Deck;
    visibility: DeckVisibility;
    onEmpty?: () => void;
    onDraw?: (card: CardEngine.PlayingCard) => void;
    visibleButtons?: boolean;
}

interface IManagedDeckState extends ICommonState {
    deck: CardEngine.Deck;
    visibility: DeckVisibility
}

export class ManagedDeck extends React.Component<IManagedDeckProps, IManagedDeckState> implements CardEngine.IManagedDeck {
    public id: string;
    protected children? : React.ReactNode;
    private cm;
    protected menuItems : any[];

    constructor(props: IManagedDeckProps) {
        super(props);
        this.state = {
            deck: props.initialDeck, 
            visibility: props.visibility,
        };
        this.id = props.engine.assignDeck(this as CardEngine.IManagedDeck);
        this.cm = createRef<ContextMenu>();
        this.menuItems = [];
    }

    getDeck = () => {
        return this.state.deck;
    }

    setDeck = (newDeck: CardEngine.Deck) => {
        this.setState( {deck: newDeck} );
    }

    depositCard = (card: CardEngine.PlayingCard) => {
        const newDeck = this.state.deck.clone();
        newDeck.insertTop(card);
        this.setState( {deck: newDeck} );
        return true;
    }

    sort = () => {
        const newDeck = this.state.deck.clone();
        newDeck.sort();
        this.setState( {deck: newDeck} );
    }

    shuffle = () => {
        const newDeck = this.state.deck.clone();
        newDeck.shuffle();
        this.setState( {deck: newDeck} );
    }

    changeVisibility(value: DeckVisibility) {
        this.setState( {visibility: value} );
    }

    render() {
        const { name } = this.props;
        const { visibility, deck } = this.state;

        let inner: JSX.Element;
        const topCard = deck.peek(0);
        const secondCard = deck.peek(1);

        switch (visibility) {
            case DeckVisibility.TopOne:
                inner = topCard ? <RenderedPlayingCard card={topCard} hidden={false}/> : <span>No cards</span>;
                break;
            case DeckVisibility.TopTwo:
            case DeckVisibility.TopTwoSecondHidden:
            case DeckVisibility.TopTwoFirstHidden:
            case DeckVisibility.TopTwoFlipped:
                let flip = visibility === DeckVisibility.TopTwoFirstHidden || visibility === DeckVisibility.TopTwoFlipped;
                let backHidden = visibility !== DeckVisibility.TopTwo && visibility !== DeckVisibility.TopTwoFlipped;
                inner = topCard ? (secondCard 
                    ? (<div className='StackedCardParent'><div className='StackedCardOne'><RenderedPlayingCard card={!flip ? topCard : secondCard} hidden={false}/></div>
                    <div className='StackedCardTwo'><RenderedPlayingCard card={!flip ? secondCard : topCard} hidden={backHidden}/></div></div>) 
                    : (<RenderedPlayingCard card={topCard} hidden={false}/>)) 
                    : <span>No cards</span>;
                break;
            default:
                inner = topCard ? <RenderedPlayingCard card={topCard} hidden={true}/> : <span>No cards</span>;
                break;
        }

        return (
            <div>
                <ContextMenu model={this.menuItems} ref={this.cm}/>
                <div className={this.props.isClickEnabled ? 'clickable' : ''} onClick={() => { if (this.props.isClickEnabled && this.props.onClick !== undefined) this.props.onClick()}}>
                    <div className="Deck" onContextMenu={(e) => this.cm.current?.show(e)}>
                        <span>{name} [{deck.size}]</span>
                        <div>{inner}</div>
                        <div>
                            {/* options section */}
                            {this.children}
                        </div>
                    </div>
                </div>                  
            </div>
        
        );
    }
}

export class ManagedDrawPile extends ManagedDeck {

    private onDraw;
    private onEmpty;

    constructor(props: IManagedDeckProps) {
        super(props);
        this.onDraw = props.onDraw;
        this.onEmpty = props.onEmpty;
    }

    drawCard = () => {
        const newDeck = this.state.deck.clone();
        let card = newDeck.draw();
        this.setState({ deck: newDeck });
        if(card === null) {
            if(this.onEmpty !== undefined) this.onEmpty();
        }
        else if(card !== undefined) {
            if(this.onDraw !== undefined) this.onDraw(card);
        }
        return card;
    }

    override render() { 
        if (this.props.visibleButtons) {
            this.children = (
                <button onClick={this.drawCard}>Draw</button>
            );
        }
        this.menuItems = [
            {
                label: 'Draw', command: this.drawCard
            }
        ]
        return super.render();
    }
}

interface IManagedHandProps extends ICommonProps {
    initialDeck: CardEngine.Deck;
    onSelect?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}

interface IManagedHandState extends ICommonState {
    deck: CardEngine.Deck;
    hoveredCardIndex : number | null;
}

export class ManagedHand extends React.Component<IManagedHandProps, IManagedHandState> implements CardEngine.IManagedDeck {

    public id: string;
    private onSelect;
    private cm;
    private pickedCardIndex;

    constructor(props: IManagedHandProps) {
        super(props);
        this.state = {
            deck: props.initialDeck,
            hoveredCardIndex: null,
        }

        this.id = props.engine.assignDeck(this as CardEngine.IManagedDeck);
        this.cm = createRef<ContextMenu>();
        this.onSelect = props.onSelect;
        this.pickedCardIndex = -1;
    }

    checkDeck() {
        if (this.state.deck.size === 0) {
            if (this.props.onEmpty !== undefined) this.props.onEmpty();
        }
    }

    getDeck = () => {
        return this.state.deck;
    }

    setDeck = (newDeck: CardEngine.Deck) => {
        this.setState( {deck: newDeck} );
        this.checkDeck();
    }

    pickCard = () => {
        let index = this.state.hoveredCardIndex;
        if (index !== null && this.onSelect !== undefined) {
            let card = this.state.deck.list[index];
            this.pickedCardIndex = index;
            if (this.state.deck.size === 1) this.setState({ hoveredCardIndex: null });
            if (this.props.engine.startPlay(card, () => {return this.drawCard() !== null}))
            this.onSelect(card);
        }
    }

    drawCard = () => {
        if (this.pickedCardIndex >= 0) {
            let card = this.state.deck.list[this.pickedCardIndex];
            const newDeck = this.state.deck.clone();
            if (newDeck.remove(card)) {
                this.setState( {deck: newDeck} );
                this.checkDeck();
                return card;
            }
        }

        return null;
    }

    depositCard = (card: CardEngine.PlayingCard) => {
        const newDeck = this.state.deck.clone();
        newDeck.insertTop(card);
        this.setState( {deck: newDeck} );
        this.checkDeck();
        return true;
    }

    sort = () => {
        const newDeck = this.state.deck.clone();
        newDeck.sort();
        this.setState({ deck: newDeck });
    }

    shuffle = () => {
        const newDeck = this.state.deck.clone();
        newDeck.shuffle();
        this.setState({ deck: newDeck });
    }

    render() {
        const HAND_SIZE = window.innerWidth > 1000 ? 6 : 2;

        const menuItems = [
            {
                label: 'Pick', command: this.pickCard
            },
        ];

        class CardBundle {
            card: CardEngine.PlayingCard;
            index: number;
            constructor(card: CardEngine.PlayingCard, index: number) {
                this.card = card;
                this.index = index;
            }
        }

        const itemTemplate = (bundle: CardBundle | null) => {

            if (bundle === null) {
                return (<RenderedPlayingCardPlaceholder/>)
            }

            return (<div
                onContextMenu={(e) => this.cm.current?.show(e)}
                key={bundle.index}
                className={`hand-card ${this.state.hoveredCardIndex === bundle.index ? 'hovered' : ''}`}
                onMouseEnter={() => this.setState({hoveredCardIndex: bundle.index})}
                onMouseLeave={() => this.setState({hoveredCardIndex: null})}
                onClick={this.pickCard}>
                <RenderedPlayingCard card={bundle.card} hidden={false} />
                </div>);
        }

        let items = this.state.deck.list.map((card, index) => new CardBundle(card, index));
        let placeholderEdge = Math.max(0, HAND_SIZE - items.length) / 2;
        let leftEdge = Math.floor(placeholderEdge);
        let rightEdge = Math.ceil(placeholderEdge);
        items = Array(leftEdge).fill(null).concat(items);
        items = items.concat(Array(rightEdge).fill(null));
        const footer = (<Button label='Sort' onClick={this.sort}/>);
        const content = this.state.deck.size === 0 ? <span>No cards</span> : <Carousel className='hand' numVisible={HAND_SIZE} value={items} itemTemplate={itemTemplate} footer={footer}/>;
        return (
            <div className={this.props.isClickEnabled ? 'clickable' : ''} onClick={() => { if (this.props.isClickEnabled && this.props.onClick !== undefined) this.props.onClick()}}>
                <div className='hand'>
                    <ContextMenu model={menuItems} ref={this.cm}/>
                    {content}
                </div>
            </div>
        );       
    }
}

interface IManagedOpponentHandState extends ICommonState {
    deck: CardEngine.Deck;
    visibleCards: Set<CardEngine.PlayingCard>;
}

interface IManagedOpponentHandProps extends ICommonProps {
    initialDeck: CardEngine.Deck;
    onSelect?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}

export class ManagedOpponentHand extends React.Component<IManagedOpponentHandProps, IManagedOpponentHandState> implements CardEngine.IManagedDeck {

    public id: string;
    private pickedCardIndex;

    constructor(props: IManagedHandProps) {
        super(props);
        this.state = {
            deck: props.initialDeck,
            visibleCards: new Set<CardEngine.PlayingCard>(),
        }

        this.id = props.engine.assignDeck(this as CardEngine.IManagedDeck);
        this.pickedCardIndex = -1;
    }

    checkDeck() {
        if (this.state.deck.size === 0) {
            if (this.props.onEmpty !== undefined) this.props.onEmpty();
        }
    }

    getDeck = () => {
        return this.state.deck;
    }

    setDeck = (newDeck: CardEngine.Deck) => {
        this.setState({ deck: newDeck });
        this.checkDeck();
    }

    drawCard = () => {
        if (this.pickedCardIndex >= 0) {
            let card = this.state.deck.list[this.pickedCardIndex];
            const newDeck = this.state.deck.clone();
            if (newDeck.remove(card)) {
                this.setState({ deck: newDeck });
                this.checkDeck();
                return card;
            }
        }

        return null;
    }

    depositCard = (card: CardEngine.PlayingCard) => {
        const newDeck = this.state.deck.clone();
        newDeck.insertTop(card);
        this.setState({ deck: newDeck });
        this.checkDeck();
        return true;
    }

    sort = () => {
        const newDeck = this.state.deck.clone();
        newDeck.sort();
        this.setState( {deck: newDeck} );
    }

    shuffle = () => {
        const newDeck = this.state.deck.clone();
        newDeck.shuffle();
        this.setState( {deck: newDeck} );
    }

    showCards = (cards: CardEngine.PlayingCard[]) => {
        let tempSet = this.state.visibleCards;
        cards.forEach(card => {
            tempSet = tempSet.add(card);
        });
        this.setState({ visibleCards: tempSet });
    }

    showAllCards = () => {
        let tempSet = { ...this.state.visibleCards };
        this.state.deck.list.forEach((card) => {
            tempSet.add(card);
        });
        this.setState({ visibleCards: tempSet });
    }

    hideCards = (...cards: CardEngine.PlayingCard[]) => {
        let tempSet = { ...this.state.visibleCards };
        cards.forEach(card => {
            tempSet.delete(card);
        });
        this.setState({ visibleCards: tempSet });
    }

    hideAllCards = () => {
        let tempSet = { ...this.state.visibleCards };
        tempSet.clear();
        this.setState({ visibleCards: tempSet });
    }

    render() {
        return (      
            <div className={this.props.isClickEnabled ? 'clickable' : ''} onClick={() => { if (this.props.isClickEnabled && this.props.onClick !== undefined) this.props.onClick()}}>
                <div className='opp-hand'>
                    <span>{this.props.name} [{this.state.deck.size}]</span>
                    <div className='opp-hand-cards'>
                        {this.state.deck.list.map((card) => <div key={card.toString()} className='opp-hand-card'><RenderedPlayingCard card={card} hidden={!this.state.visibleCards.has(card)}/></div>)}
                    </div>
                </div>
            </div>          
        );       
    }
}

interface IManagedMoneyProps {
    startingMoney: number;
    minBet: number;
    maxBet: number;
}

interface IManagedMoneyState {
    currentMoney: number;
    bets: number[];
    newBet: boolean;
    newBetValue: number;
    callback?: () => void;
}

const currencyFormat = new Intl.NumberFormat("en-us", { 
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

export class ManagedMoney extends React.Component<IManagedMoneyProps, IManagedMoneyState> {
    private totalBetCount = 0;
    private betMap;
    private inputRef;

    constructor(props: IManagedMoneyProps) {
        super(props);
        this.state = { currentMoney: props.startingMoney, bets: [], newBet: false, newBetValue: props.minBet }
        this.betMap = new Map<number, number>();
        this.inputRef = createRef<InputNumber>();
    }

    createBet(onCreationCallback: (id: number) => void) {
        const finishBet = () => {
            const betId = this.totalBetCount++;
            this.setState({ 
                bets: this.state.bets.concat(this.state.newBetValue), 
                currentMoney: this.state.currentMoney - this.state.newBetValue, 
                newBet: false, 
                callback: undefined
            });
            this.betMap.set(betId, this.state.newBetValue);
            onCreationCallback(betId);
        }
        this.setState( { newBet: true, newBetValue: this.props.minBet, callback: finishBet });
    }

    createBetWithValue(value: number) {
        if (value > this.state.currentMoney) {
            return undefined;
        }
        const betId = this.totalBetCount++;
        this.setState({ 
            bets: this.state.bets.concat(value), 
            currentMoney: this.state.currentMoney - value, 
        });
        this.betMap.set(betId, this.state.newBetValue);
        return betId;
    }

    resolveBet(betId: number, multiplier: number) {
        const betValue = this.betMap.get(betId)!;
        this.betMap.delete(betId);
        let newBets = [...this.state.bets];
        newBets.splice(newBets.indexOf(betValue), 1);
        this.setState( { bets: newBets, currentMoney: this.state.currentMoney + Math.floor(betValue * multiplier) });
    }

    tryAdjustBet(betId: number, multiplier: number) : boolean {
        const betValue = this.betMap.get(betId)!;
        const newBetValue = betValue * multiplier;
        const neededMoney = newBetValue - betValue;
        if (neededMoney > this.state.currentMoney) return false;

        let newBets = [...this.state.bets];
        newBets[newBets.indexOf(betValue)] = newBetValue;
        this.betMap.set(betId, newBetValue);
        this.setState( { bets: newBets, currentMoney: this.state.currentMoney - neededMoney });
        return true;
    }

    getBetValue(betId: number) {
        return this.betMap.get(betId);
    }

    render() {
        const money = (<span className='cash-display'>{currencyFormat.format(this.state.currentMoney)}</span>);
        const message = this.state.currentMoney >= this.state.newBetValue ? 
        (<div><Message className='bet-maker' severity='success' text="Bet Good"/><Button className='bet-maker' label='BET' onClick={this.state.callback}/></div>)
        : (<Message className='bet-maker' severity='error' text="Not Enough Money"/>);

        if (this.state.newBet) {
            return (<div className='cash-container'>
                {money}
                <FloatLabel>
                    <InputNumber className='bet-maker'
                    autoFocus={true}
                    ref={this.inputRef} 
                    id="bet" 
                    value={this.state.newBetValue} 
                    mode="currency" 
                    currency="USD" 
                    locale="en-US" 
                    maxFractionDigits={0}
                    onValueChange={(v) => this.setState({ newBetValue: v.value ?? this.props.minBet })} 
                    min={this.props.minBet}
                    max={this.props.maxBet}/>
                    <label htmlFor='bet'>Bet</label></FloatLabel>{message}
                </div>);
        }
        else if (this.state.bets.length > 0) {
            return (<div className='cash-container'>{money}<h3 className='bets-display'>Bets:</h3><ul className='bets-display'>{this.state.bets.map((bet, index) => {
                return (<li key={index}>{currencyFormat.format(bet)}</li>);
            })}</ul></div>)
        }

        return (<div className='cash-container'>{money}</div>);
    }
}

interface IBigMessageProps {
    children?: string;
}

export const BigMessage: React.FC<IBigMessageProps> = (props) => {
    return (
        <span className='big-message'>{props.children}</span>
    );
}

interface IManagedBookDisplayProps {
    title: string;
    owners: string[];
    onFillBook?: (owner: string, cardValue: CardEngine.CardValue) => void;
}

interface IManagedBookDisplayState {
    library: CardEngine.CardValue[][];
    completed: CardEngine.CardValue[];
}

export class ManagedBookDisplay extends React.Component<IManagedBookDisplayProps, IManagedBookDisplayState> {

    constructor(props: IManagedBookDisplayProps) {
        super(props);
        this.state = { library: [], completed: [] }
    }

    get completedBooks() {
        return this.state.completed;
    }

    get scores() {
        return this.state.library.map((list, index) => {
            return {            
                name: this.props.owners[index],
                score: list.length
            }
        }).sort((left, right) => right.score - left.score);
    }

    init() {
        let lib = [];
        for (let i = 0; i < this.props.owners.length; i++) {
            lib.push(new Array());
        }
        this.state = { library: lib, completed: [] }
    }

    fill(deck: CardEngine.Deck, owner: string) {
        const [fullBooks, newDeck] = CardEngine.fillBooks(deck);
        const ownerIndex = this.props.owners.indexOf(owner);
        if (ownerIndex === -1) {
            throw `Unknown owner '${owner}'`;
        }
        let tempLib = [...this.state.library];
        let tempCompleted = [...this.state.completed];
        for (const book of fullBooks) {
            tempLib[ownerIndex].push(book);
            tempCompleted.push(book);
        }
        this.setState({ library: tempLib, completed: tempCompleted });
        for (const book of fullBooks) {
            if (this.props.onFillBook !== undefined) this.props.onFillBook(owner, book);
        }
        return newDeck;
    }

    render() {
        return (
            <div className='book-display'>
                <span>{this.props.title}</span>
                <ul>
                    {
                        this.props.owners.map((owner) => (
                            <li key={owner}>
                                <span>{owner}</span>
                                <ul>
                                {
                                    this.state.library[this.props.owners.indexOf(owner)]?.map((cardValue) => (
                                        <li key={cardValue}>{CardEngine.pluralValueNames.get(cardValue)}</li>
                                    ))
                                }
                                </ul>
                            </li>
                        ))
                    }
                </ul>
            </div>
        );
    }

}