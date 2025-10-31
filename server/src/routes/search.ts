import { Router, Request, Response } from 'express';
import { OMDbService } from '../services/omdb';
import { asyncHandler } from '../middleware/errorHandler';
import { sendBadRequest } from '../utils/apiResponse';
import { validateQueryParam, validatePageNumber } from '../utils/validators';
import { transformOMDbMovies } from '../utils/transformers';

const router = Router();

// Search movies via OMDb API
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { q, page } = req.query;

  // Validate query parameter
  const queryValidation = validateQueryParam(q);
  if (!queryValidation.isValid) {
    return sendBadRequest(res, queryValidation.error!);
  }

  // Validate page number
  const pageValidation = validatePageNumber(page);
  if (!pageValidation.isValid) {
    return sendBadRequest(res, pageValidation.error!);
  }

  const pageNumber = pageValidation.value!;
  const queryString = q as string;

  const { results, totalResults } = await OMDbService.searchMovies(queryString, pageNumber);

  res.json({
    success: true,
    query: queryString,
    page: pageNumber,
    totalResults,
    results: transformOMDbMovies(results),
  });
}));

export default router;
