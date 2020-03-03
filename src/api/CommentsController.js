import Comments from '../model/Comments'
import { checkCode } from '@/common/Utils'
import { getJWTPayload } from '@/common/Utils'
// import Post from '../model/Post'
// import User from '../model/User'
class CommentsController {
    async getComments(ctx) {
        const params = ctx.query
        const tid = params.tid
        const page = params.page ? params.page : 0
        const limit = params.limit ? parseInt(params.limit) : 10
        const result = await Comments.getCommentsList(tid, page, limit)
        const total = await Comments.queryCount(tid)
        ctx.body = {
            code: 200,
            data: result,
            msg: '查询成功',
            total
        }
    }
    async addComment(ctx) {
        const { body } = ctx.request
        let sid = body.sid
        let code = body.code
        // 验证图片验证码的时效性、正确性
        let result = await checkCode(sid, code)
        if (!result) {
            // 验证用户账号密码是否正确
            ctx.body = {
                code: 500,
                msg: '图片验证码不正确，请检查！'
            }
            return
        }
        const newComment = new Comments(body)
        const obj = await getJWTPayload(ctx.header.authorization)
        newComment.cuid = obj._id
        const comment = await newComment.save()
        ctx.body = {
            code: 200,
            msg: '评论成功',
            data: comment
        }
    }
}
export default new CommentsController()