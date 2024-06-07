import CardEngine from './CardEngine'
import React, {createRef, useRef, useState} from 'react';
import { ContextMenu } from 'primereact/contextmenu'

import './card-renderer.css'
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';

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
            if (this.props.engine.startPlay(card, () => {return this.drawCard() === null}))
            this.onSelect(card);
        }
    }

    drawCard = () => {
        if (this.pickedCardIndex >= 1) {
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

    render() {
        const items = [
            {
                label: 'Options',
                items: [
                    { label: 'View', icon: 'pi pi-fw pi-search', command: () => { alert('View clicked'); } },
                    { label: 'Delete', icon: 'pi pi-fw pi-times', command: () => { alert('Delete clicked'); } }
                ]
            },
            {
                label: 'Navigate',
                items: [
                    { label: 'Home', icon: 'pi pi-fw pi-home', url: 'http://www.primefaces.org/primereact' },
                    { label: 'Company', icon: 'pi pi-fw pi-globe', command: () => { window.location.href = 'http://www.primefaces.org' } }
                ]
            }
        ];

        return (
            <div>
                <ContextMenu model={items} ref={this.cm}/>
                <div className="hand" onContextMenu={(e) => this.cm.current?.show(e)}>
                {this.state.deck.list.map((card, index) => (
                    <div
                    key={index}
                    className={`hand-card ${this.state.hoveredCardIndex === index ? 'hovered' : ''}`}
                    onMouseEnter={() => this.setState({hoveredCardIndex: index})}
                    onMouseLeave={() => this.setState({hoveredCardIndex: null})}
                    onClick={this.pickCard}
                    >
                    <RenderedPlayingCard card={card} hidden={false} />
                    </div>
                ))}
                </div>
            </div>
        );       
    }
}