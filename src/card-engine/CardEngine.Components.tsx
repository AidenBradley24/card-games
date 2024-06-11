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

export const RenderedPlayingCard: React.FC<IRenderedPlayingCardProps> = ({ card, hidden }) => {
    return (
        <img className="PlayingCard" src={'card_graphics/' + card.id(hidden) + '.svg'}/>
    );
}

export const RenderedPlayingCardPlaceholder: React.FC = () => {
    return (
        <div className='PlayingCardPlaceholder'></div>
    );
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
    
interface IManagedDeckProps {
    name: string;
    engine: CardEngine.Engine;
    initialDeck: CardEngine.Deck;
    visibility: DeckVisibility;
    onEmpty?: () => void;
    onDraw?: (card: CardEngine.PlayingCard) => void;
    visibleButtons?: boolean;
}

interface IManagedDeckState {
    deck: CardEngine.Deck;
    visibility: DeckVisibility
}

interface IManagedHandState extends IManagedDeckState {
    hoveredCardIndex : number | null;
}

export class ManagedDeck extends React.Component<IManagedDeckProps, IManagedDeckState> implements CardEngine.IManagedDeck {
    public id: string;
    protected children? : React.ReactNode;
    private cm;
    protected menuItems : any[];

    constructor(props: IManagedDeckProps) {
        super(props);
        this.state = {deck: props.initialDeck, visibility: props.visibility};
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
                <div className="Deck" onContextMenu={(e) => this.cm.current?.show(e)}>
                    <span>{name}: {deck.size}</span>
                    <div>{inner}</div>
                    <div>
                        {/* options section */}
                        {this.children}
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

interface IHandProps {
    name: string;
    engine: CardEngine.Engine;
    initialDeck: CardEngine.Deck;
    onSelect?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}

export class ManagedHand extends React.Component<IHandProps, IManagedHandState> implements CardEngine.IManagedDeck {

    public id: string;
    private onSelect;
    private cm;
    private pickedCardIndex;

    constructor(props: IHandProps) {
        super(props);
        this.state = {
            deck: props.initialDeck,
            hoveredCardIndex: null,
            visibility: DeckVisibility.Hidden
        }

        this.id = props.engine.assignDeck(this as CardEngine.IManagedDeck);
        this.cm = createRef<ContextMenu>();
        this.onSelect = props.onSelect;
        this.pickedCardIndex = -1;
    }

    getDeck = () => {
        return this.state.deck;
    }

    setDeck = (newDeck: CardEngine.Deck) => {
        this.setState( {deck: newDeck} );
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
                this.setState({ deck: newDeck });
                return card;
            }
        }

        return null;
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

    render() {
        const HAND_SIZE = 6;

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
            <div className='hand'>
                <ContextMenu model={menuItems} ref={this.cm}/>
                {content}
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

    constructor(props: IManagedMoneyProps) {
        super(props);
        this.state = {currentMoney: props.startingMoney, bets: [], newBet: false, newBetValue: props.minBet }
        this.betMap = new Map<number, number>();
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

    render() {
        const money = (<span className='cash-display'>{currencyFormat.format(this.state.currentMoney)}</span>);
        const message = this.state.currentMoney >= this.state.newBetValue ? 
        (<div><Message severity='success' text="Bet Good"/><Button label='BET' onClick={this.state.callback}/></div>)
        : (<Message severity='error' text="Not Enough Money"/>);

        if (this.state.newBet) {
            return (<div className='cash-container'>{money}<InputNumber value={this.state.newBetValue} mode="currency" currency="USD" locale="en-US" maxFractionDigits={0}
                onValueChange={(v) => this.setState( {newBetValue: v.value ?? this.props.minBet})} min={this.props.minBet} max={this.props.maxBet}/>{message}</div>);
        }
        else if (this.state.bets.length > 0) {
            return (<div className='cash-container'>{money}<h3 className='bets-display'>Bets:</h3><ul className='bets-display'>{this.state.bets.map((bet) => {
                return (<li>{currencyFormat.format(bet)}</li>);
            })}</ul></div>)
        }

        return (<div className='cash-container'>{money}</div>);
    }
}