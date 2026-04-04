import { Router } from 'express';
import { uploadVideo, listVideos, getVideoById, reprocessVideo, streamVideo, deleteVideo } from '../controllers/video.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { upload, normalizeCloudinaryFile } from '../config/upload.js';
import { videoListQuerySchema } from '@video-streamer/shared';

const router = Router();

router.post(
  '/upload',
  authenticate,
  authorize(['admin', 'editor']),
  upload.any(),
  normalizeCloudinaryFile,
  uploadVideo
);

router.get('/list', authenticate, validateQuery(videoListQuerySchema), listVideos);
router.post('/:videoId/reprocess', authenticate, authorize(['admin']), reprocessVideo);
router.get('/:videoId/stream', authenticate, streamVideo);
router.get('/:videoId', authenticate, getVideoById);
router.delete('/:videoId', authenticate, deleteVideo);

export default router;
