import CardEngine from './CardEngine'
import React, {createRef, useRef, useState} from 'react';
import { ContextMenu } from 'primereact/contextmenu'

import './card-renderer.css'
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Carousel } from 'primereact/carousel';
import { Button } from 'primereact/button';

export const RenderedPlayingCard: React.FC<IRenderedPlayingCardProps> = ({ card, hidden }) => {
    return (
        <img className="PlayingCard" src={'card_graphics/' + card.id(hidden) + '.svg'}/>
    );
}
 
interface IRenderedPlayingCardProps {
    card: CardEngine.PlayingCard;
    hidden: boolean;
}

export enum DeckMode {
    Hidden,
    TopOne,
    Hand,
}
  
interface IManagedDeckProps {
    name: string;
    engine: CardEngine.Engine;
    initialDeck: CardEngine.Deck;
    mode: DeckMode;
    onDraw?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}


interface IManagedDeckState {
    deck: CardEngine.Deck;
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
        this.state = {deck: props.initialDeck};
        this.id = props.engine.assignDeck(this as CardEngine.IManagedDeck);
        this.cm = createRef<ContextMenu>();
        this.menuItems = [];
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
        const { mode, name } = this.props;
        const { deck } = this.state;

        let inner: JSX.Element;
        const topCard = deck.peek();

        switch (mode) {
            case DeckMode.TopOne:
                inner = topCard ? <RenderedPlayingCard card={topCard} hidden={false}/> : <span>No cards left</span>;
                break;
            default:
                inner = topCard ? <RenderedPlayingCard card={topCard} hidden={true}/> : <span>No cards left</span>;
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
        this.children = (
            <button onClick={this.drawCard}>Draw</button>
        );

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
        }

        this.id = props.engine.assignDeck(this as CardEngine.IManagedDeck);
        this.cm = createRef<ContextMenu>();
        this.onSelect = props.onSelect;
        this.pickedCardIndex = -1;
    }

    pickCard = () => {
        let index = this.state.hoveredCardIndex;
        if (index !== null && this.onSelect !== undefined) {
            let card = this.state.deck.list[index];
            this.pickedCardIndex = index;
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

        const itemTemplate = (bundle: CardBundle) => {
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

        const items = this.state.deck.list.map((card, index) => new CardBundle(card, index));
        const footer = (<Button label='Sort' onClick={this.sort}/>);

        return (
            <div>
                <ContextMenu model={menuItems} ref={this.cm}/>
                <Carousel className='hand' numVisible={6} value={items} itemTemplate={itemTemplate} footer={footer}/>
            </div>
        );       
    }
}