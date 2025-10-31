import { Router, Request, Response } from 'express';
import { OMDbService } from '../services/omdb';

const router = Router();

// Search movies via OMDb API
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, page } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    const pageNumber = page ? Number.parseInt(page as string, 10) : 1;
    if (Number.isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number'
      });
    }

    const { results, totalResults } = await OMDbService.searchMovies(q, pageNumber);

    res.json({
      success: true,
      query: q,
      page: pageNumber,
      totalResults,
      results: results.map(movie => ({
        id: movie.imdbID,
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster === 'N/A' ? null : movie.Poster,
        type: movie.Type
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search movies'
    });
  }
});

export default router;
