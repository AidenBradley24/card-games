import CardEngine from './CardEngine'
import React, {useState} from 'react';

import './card-renderer.css'

export const RenderedPlayingCard: React.FC<IRenderedPlayingCardProps> = ({ card }) => {
    return (
      <div className="PlayingCard">
        <p>{card.toString()}</p>
      </div>
    );
}
 
interface IRenderedPlayingCardProps {
    card: CardEngine.PlayingCard;
}

export enum DeckMode {
    Hidden,
    TopOne,
    Hand,
}
  
interface IRenderedDeckProps {
    name: string;
    initialDeck: CardEngine.Deck;
    mode: DeckMode;
    onDraw?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}

interface IRenderedDeckState {
    deck: CardEngine.Deck;
}

export class RenderedDeck extends React.Component<IRenderedDeckProps, IRenderedDeckState> {

    protected children? : React.ReactNode;

    constructor(props: IRenderedDeckProps) {
        super(props);
        this.state = {deck: props.initialDeck};
    }

    render() {
        const { mode, name } = this.props;
        const { deck } = this.state;

        let inner: JSX.Element;

        switch (mode) {
            case DeckMode.TopOne:
                const topCard = deck.peek();
                inner = topCard ? <RenderedPlayingCard card={topCard}/> : <span>No cards left</span>;
                break;
            default:
                inner = <span>hidden</span>;
                break;
        }

        return (
        <div className="Deck">
            <span>{name}: {deck.size}</span>
            <div>{inner}</div>
            <div>
                {/* options section */}
                {this.children}
            </div>
        </div>
        );
    }
}

export class DrawPile extends RenderedDeck {

    private onDraw;
    private onEmpty;

    constructor(props: IRenderedDeckProps) {
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
    }

    override render() { 
        this.children = (
            <button onClick={this.drawCard}>Draw</button>
        );
        return super.render();
    }
}

interface IHandState extends IRenderedDeckState {
    hoveredCardIndex : number | null;
}

interface IHandProps {
    name: string;
    initialDeck: CardEngine.Deck;
    onSelect?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}

export class Hand extends React.Component<IHandProps, IHandState> {

    private onSelect;

    constructor(props: IHandProps) {
        super(props);
        this.state = {
            deck: props.initialDeck,
            hoveredCardIndex: null
        }
        this.onSelect = props.onSelect;
    }

    playCard = () => {

        let index = this.state.hoveredCardIndex;
        if(index !== null) {
            if(this.onSelect !== undefined) this.onSelect(this.state.deck.list[index]);
        }
    }

    render() {
        return (
            <div className="hand">
              {this.state.deck.list.map((card, index) => (
                <div
                  key={index}
                  className={`hand-card ${this.state.hoveredCardIndex === index ? 'hovered' : ''}`}
                  onMouseEnter={() => this.setState({hoveredCardIndex: index})}
                  onMouseLeave={() => this.setState({hoveredCardIndex: null})}
                  onClick={this.playCard}
                >
                  <RenderedPlayingCard card={card} />
                </div>
              ))}
            </div>
        );       
    }
}