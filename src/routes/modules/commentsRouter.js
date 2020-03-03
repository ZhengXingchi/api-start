import Router from 'koa-router'
import commentsController from '@/api/CommentsController'
const router = new Router()
router.prefix('/comments')
router.post('/reply',commentsController.addComment)
export default router