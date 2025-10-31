import { Movie } from '../types';
import { getDb } from '../db/database';
import { wsService } from '../services/websocket';

/**
 * Handle winner broadcasts when a movie becomes a winner
 */
export const handleWinnerBroadcast = (movie: Movie): void => {
  const db = getDb();

  // Check if movie became a winner
  const isWinner = movie.status === 'winner';

  if (isWinner) {
    // Get the latest winner entry and all winners
    const winners = db.getAllWinners();
    const latestWinner = winners[0]; // Winners are sorted by wonAt DESC

    // Broadcast winner events
    if (latestWinner) {
      wsService.broadcastMovieWinner(latestWinner);
      wsService.broadcastWinnersUpdated(winners);
    }
  } else {
    // Broadcast regular vote event
    wsService.broadcastMovieVoted(movie);
  }
};
