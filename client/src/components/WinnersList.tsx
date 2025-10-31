import type { Winner } from '../types';
import trophyIcon from '../assets/trophy.svg';
import medalIcon from '../assets/medal.svg';
import awardIcon from '../assets/award.svg';

interface WinnersListProps {
  winners: Winner[];
}

export const WinnersList = ({ winners }: WinnersListProps) => {
  if (winners.length === 0) {
    return (
      <div style={{ textAlign: 'left', padding: '2rem 0' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={trophyIcon} alt="Trophy" style={{ width: '1.5rem', height: '1.5rem' }} />
          Past Winners
        </h2>
        <p style={{ color: '#888', fontStyle: 'italic' }}>
          No winners yet. Be the first to vote a movie to victory!
        </p>
      </div>
    );
  }
//  move this function to helper folder Helper function to format timestamp to DD-MM-YYYY
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src={trophyIcon} alt="Trophy" style={{ width: '1.5rem', height: '1.5rem' }} />
        Past Winners ({winners.length})
      </h2>

      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollBehavior: 'smooth',
        }}
      >
        {winners.map((winner, index) => (
          <div
            key={winner.id}
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              position: 'relative',
              minWidth: '320px',
              maxWidth: '320px',
              flexShrink: 0,
            }}
          >
            {/* Rank Badge */}
            <div
              style={{
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#1a1a1a',
                borderRadius: '50%',
                padding: '5px 3px 2px',
              }}
            >
              {index === 0 ? (
                <img src={medalIcon} alt="1st Place" style={{ width: '2.3rem', height: '2.3rem' }} />
              ) : index === 1 ? (
                <img src={awardIcon} alt="2nd Place" style={{ width: '2.3rem', height: '2.3rem' }} />
              ) : index === 2 ? (
                <img src={awardIcon} alt="3rd Place" style={{ width: '2.3rem', height: '2.3rem' }} />
              ) : (
                <img src={trophyIcon} alt="Winner" style={{ width: '2.3rem', height: '2.3rem' }} />
              )}
            </div>

            {/* Poster */}
            {winner.poster && winner.poster !== 'N/A' ? (
              <img
                src={winner.poster}
                alt={winner.title}
                style={{
                  width: '80px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '80px',
                  height: '120px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: '#666',
                }}
              >
                No Poster
              </div>
            )}

            {/* Winner Info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>
                {winner.title}
              </h3>
              <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                {winner.year}
              </p>
              <div style={{ display: 'flex', fontSize: '0.9rem', flexDirection: 'column' }}>
                <span>
                  <strong>{winner.finalVotes}</strong> final votes
                </span>
                <span style={{ color: '#888' }}>
                  Won on {formatDate(winner.wonAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
