import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { getMovies, getWinners } from './services/api';
import { MovieSearch } from './components/MovieSearch';
import type { Movie, Winner } from './types';
import './App.css';

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set up WebSocket listeners
  useWebSocket({
    onMovieAdded: (movie) => {
      console.log('Movie added:', movie);
      setMovies((prev) => [movie, ...prev]);
    },
    onMovieVoted: (movie) => {
      console.log('Movie voted:', movie);
      setMovies((prev) =>
        prev.map((m) => (m.id === movie.id ? movie : m))
      );
    },
    onMovieWinner: (winner) => {
      console.log('Movie winner:', winner);
      setMovies((prev) => prev.filter((m) => m.id !== winner.movieId));
      setWinners((prev) => [winner, ...prev]);
    },
    onWinnersUpdated: (updatedWinners) => {
      console.log('Winners updated:', updatedWinners);
      setWinners(updatedWinners);
    },
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [moviesData, winnersData] = await Promise.all([
          getMovies(),
          getWinners(),
        ]);
        setMovies(moviesData);
        setWinners(winnersData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="app">
        <h1>Movie of the Week</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div style={{display: 'flex', marginBottom: '2rem'}}>
        <h1 style={{ textAlign: "left", width: '50%', margin: 0 }}>🎬 Movie of the Week</h1>
        <div style={{ textAlign: "left", width: '50%', display: 'flex', justifyContent: 'flex-end', alignItems: 'end', gap: '1rem' }}>
          <p>Active Movies: {movies.length}</p>
          <p>Past Winners: {winners.length}</p>
        </div>
      </div>

      {/* Movie Search Component */}
      <MovieSearch />
    </div>
  );
}

export default App;
