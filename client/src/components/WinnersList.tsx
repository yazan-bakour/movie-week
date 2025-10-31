import type { Winner } from '../types';
import { formatDate } from '../utils/formatters';
import { PosterImage } from './shared/PosterImage';
import trophyIcon from '../assets/trophy.svg';
import medalIcon from '../assets/medal.svg';
import awardIcon from '../assets/award.svg';
import styles from './WinnersList.module.css';

interface WinnersListProps {
  winners: Winner[];
}

export const WinnersList = ({ winners }: WinnersListProps) => {
  if (winners.length === 0) {
    return (
      <div className="empty-state">
        <h2 className="flex align-center gap-0-5 mb-0-5">
          <img src={trophyIcon} alt="Trophy" className="icon-md" />
          Past Winners
        </h2>
        <p className="text-muted text-italic">
          No winners yet. Be the first to vote a movie to victory!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <img src={trophyIcon} alt="Trophy" className="icon-md" />
        Past Winners ({winners.length})
      </h2>

      <div className={styles.carousel}>
        {winners.map((winner, index) => (
          <div
            key={winner.id}
            className={`card ${styles.winnerCard}`}
          >
            {/* Rank Badge */}
            <div className="badge badge-rank flex-center">
              {index === 0 ? (
                <img src={medalIcon} alt="1st Place" className="icon-lg" />
              ) : index === 1 ? (
                <img src={awardIcon} alt="2nd Place" className="icon-lg" />
              ) : index === 2 ? (
                <img src={awardIcon} alt="3rd Place" className="icon-lg" />
              ) : (
                <img src={trophyIcon} alt="Winner" className="icon-lg" />
              )}
            </div>

            {/* Poster */}
            <PosterImage
              src={winner.poster}
              alt={winner.title}
              width="80px"
              height="120px"
            />

            {/* Winner Info */}
            <div className={styles.winnerInfo}>
              <h3 className={styles.winnerTitle}>
                {winner.title}
              </h3>
              <p className={styles.winnerYear}>
                {winner.year}
              </p>
              <div className={styles.stats}>
                <span>
                  <strong>{winner.finalVotes}</strong> final votes
                </span>
                <span className={styles.wonDate}>
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
