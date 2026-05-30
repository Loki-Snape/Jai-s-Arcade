import GameWrapper from '../GameWrapper';
import { game, createEngine } from './engine';

export default function Game() {
  return <GameWrapper game={game} createEngine={createEngine} />;
}
