import Router from 'koa-router'
import commentsController from '@/api/CommentsController'
const router = new Router()
router.prefix('/comments')
router.post('/reply',commentsController.addComment)
router.post('/update',commentsController.updateComment)
router.get('/accept',commentsController.setBest)
router.get('/hands',commentsController.setHands)
export default router