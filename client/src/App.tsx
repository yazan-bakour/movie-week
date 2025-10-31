import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { getMovies, getWinners } from './services/api';
import { MovieSearch } from './components/MovieSearch';
import { MovieList } from './components/MovieList';
import { WinnersList } from './components/WinnersList';
import type { Movie, Winner } from './types';
import popcornIcon from './assets/popcorn.svg';
import './App.css';

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedInitialData = useRef(false);

  // Set up WebSocket listeners
  useWebSocket({
    onMoviesInitial: (movies) => {
      console.log('Movies updated via WebSocket:', movies);
      setMovies(movies);
    },
    onMovieAdded: (movie) => {
      console.log('Movie added via WebSocket:', movie);
      setMovies((prev) => {
        // Check if movie already exists
        if (prev.some((m) => m.id === movie.id)) {
          return prev;
        }
        return [movie, ...prev];
      });
    },
    onMovieVoted: (movie) => {
      console.log('Movie voted via WebSocket:', movie);
      setMovies((prev) =>
        prev.map((m) => (m.id === movie.id ? movie : m))
      );
    },
    onMovieWinner: (winner) => {
      console.log('Movie winner via WebSocket:', winner);
      setMovies((prev) => prev.filter((m) => m.id !== winner.movieId));
      setWinners((prev) => [winner, ...prev]);
    },
    onWinnersUpdated: (updatedWinners) => {
      console.log('Winners updated via WebSocket:', updatedWinners);
      setWinners(updatedWinners);
    },
  });

  // Load initial data (only once, even in React StrictMode)
  useEffect(() => {
    if (hasLoadedInitialData.current) {
      return;
    }

    hasLoadedInitialData.current = true;

    const init = async () => {
      try {
        const [moviesData, winnersData] = await Promise.all([
          getMovies(),
          getWinners(),
        ]);
        setMovies(moviesData);
        setWinners(winnersData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
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
      {/* Header */}
      <div className="header">
        <h1 className="header-title">
          <img src={popcornIcon} alt="Movie" style={{ width: '1em', height: '1em' }} />
          Movie of the Week
        </h1>
        <div className="header-stats">
          <p>Active Movies: {movies.length}</p>
          <p>Past Winners: {winners.length}</p>
        </div>
      </div>

      {/* Movie Search Component */}
      <MovieSearch />

      {/* Divider */}
      {movies.length > 0 && (
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            margin: '2rem 0',
          }}
        />
      )}

      {/* Movie List Component */}
      <MovieList movies={movies} />

      {/* Divider */}
      {winners.length > 0 && movies.length > 0 && (
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            margin: '2rem 0',
          }}
        />
      )}

      {/* Winners List Component */}
      {winners.length > 0 && <WinnersList winners={winners} />}
    </div>
  );
}

export default App;
