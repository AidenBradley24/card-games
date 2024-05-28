import CardEngine from './CardEngine'
import React, {useState} from 'react';

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
    children?: React.ReactNode; 
    onDraw?: (card: CardEngine.PlayingCard) => void;
    onEmpty?: () => void;
}

interface IRenderedDeckState {
    deck: CardEngine.Deck;
}

export class RenderedDeck extends React.Component<IRenderedDeckProps, IRenderedDeckState> {
    constructor(props: IRenderedDeckProps) {
        super(props);
        this.state = {deck: props.initialDeck};
    }

    render() {
        const { mode, name, children } = this.props;
        const { deck } = this.state;

        let inner: JSX.Element;

        switch (mode) {
            case DeckMode.TopOne:
                const topCard = deck.peek();
                inner = topCard ? <RenderedPlayingCard card={topCard} /> : <span>No cards left</span>;
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
                {children}
            </div>
        </div>
        );
    }
}

export default RenderedDeck;

export class DrawPile extends React.Component<IRenderedDeckProps, IRenderedDeckState> {

    private onDraw;
    private onEmpty;

    constructor(props: IRenderedDeckProps) {
        super(props);
        this.state = { deck: props.initialDeck };
        this.onDraw = props.onDraw;
        this.onEmpty = props.onEmpty;
    }

    drawCard() {
        const newDeck = this.state.deck.clone();
        let card = newDeck.draw();
        this.setState({ deck: newDeck });
        if(card === null) {
            if(this.onEmpty !== undefined) this.onEmpty();
        }
        else {
            if(this.onDraw !== undefined) this.onDraw(card);
        }
    }

    override render() {

        return (
            <RenderedDeck {...this.props}>
                <button onClick={this.drawCard}>Draw</button>
            </RenderedDeck>
        )
    }
}