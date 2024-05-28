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
}

interface IRenderedDeckState {
    deck: CardEngine.Deck;
}

export class RenderedDeck extends React.Component<IRenderedDeckProps, IRenderedDeckState> {
    constructor(props: IRenderedDeckProps) {
        super(props);
        this.state = {deck: props.initialDeck};
    }

    drawCard = () => {
        const newDeck = this.state.deck.clone();
        newDeck.draw();
        this.setState({ deck: newDeck });
    };

    render() {
        const { mode, name } = this.props;
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
                <button onClick={this.drawCard}>Draw</button>
            </div>
        </div>
        );
    }
}

export default RenderedDeck;