import Router from 'koa-router'
import contentController from '../../api/ContentController'

const router = new Router()

router.prefix('/content')

router.post('/upload', contentController.uploadImg)
 
// 发表新帖
router.post('/add',contentController.addPost)
export default router
