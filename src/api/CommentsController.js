import Comments from '../model/comments'
import CommentsHands from '../model/commentsHands'
import { checkCode } from '@/common/Utils'
import { getJWTPayload } from '@/common/Utils'
import Post from '../model/Post'
import User from '../model/User'

const canReply = async (ctx) => {
    let result = false
    const obj = await getJWTPayload(ctx.header.authorization)
    if (typeof obj._id === 'undefined') {
        return result
    } else {
        const user = await User.findById(obj._id)
        if (user.status === '0') {
            result = true
        }
        return result
    }
}
class CommentsController {
    async getComments(ctx) {
        const params = ctx.query
        const tid = params.tid
        const page = params.page ? params.page : 0
        const limit = params.limit ? parseInt(params.limit) : 10
        let result = await Comments.getCommentsList(tid, page, limit)
        // 判断用户是否登陆，已登录的用户才会去判断点赞信息
        let obj = {}
        if (typeof ctx.header.authorization !== 'undefined') {
            obj = await getJWTPayload(ctx.header.authorization)
        }
        result = result.map(item => item.toJSON())
        if (obj && typeof obj._id !== 'undefined') {
            result.forEach(async (item) => {
                item.handed = '0'
                const commentsHands = await CommentsHands.findOne({ cid: item._id, uid: obj._id })
                if (commentsHands && commentsHands.cid) {
                    console.log(commentsHands, 'commentsHands')
                    if (commentsHands.uid === obj._id) {
                        item.handed = '1'
                    }
                }
            })
            console.log('-----------------')
            // for(let i=0;i<result.length;i++){
            //     let item=result[i]
            //     item.handed = '0'
            //     const commentsHands = await CommentsHands.findOne({ cid: item._id,uid:obj._id })
            //     if (commentsHands && commentsHands.cid) {
            //         console.log(commentsHands,'commentsHands')
            //         if (commentsHands.uid === obj._id) {
            //             item.handed = '1'
            //         }
            //     }    
            // }
        }
        const total = await Comments.queryCount(tid)
        ctx.body = {
            code: 200,
            data: result,
            msg: '查询成功',
            total
        }
    }
    async addComment(ctx) {
        const check = await canReply(ctx)
        if (!check) {
            ctx.body = {
                code: 500,
                msg: '用户已被禁言'
            }
            return
        }
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
        const result1 = await Post.updateOne({ _id: body.tid }, { $inc: { answer: 1 } })
        if(comment._id && result1.ok === 1){
            ctx.body = {
                code: 200,
                msg: '评论成功',
                data: comment
            }
        }else{
            ctx.body = {
                code: 500,
                msg: '评论失败'
            }
        }
       
    }
    async updateComment(ctx) {
        const check = await canReply(ctx)
        if (!check) {
            ctx.body = {
                code: 500,
                msg: '用户已被禁言'
            }
            return
        }
        const { body } = ctx.request
        console.log('body', body)
        const result = await Comments.updateOne({ _id: body.cid }, { $set: body })
        ctx.body = {
            code: 200,
            msg: '修改成功',
            data: result
        }
    }
    async setBest(ctx) {
        // 对用户权限的判断，post uid=> header id
        const obj = await getJWTPayload(ctx.header.authorization)
        if (typeof obj === 'undefined' || obj._id === '') {
            ctx.body = {
                code: '401',
                msg: '用户未登陆,或者用户未授权'
            }
        }
        const params = ctx.query
        const post = await Post.findOne({ _id: params.tid })
        if (obj._id === post.uid && post.isEnd === '0') {
            // 说明是作者本人，可以去设置isBest
            const result = await Post.updateOne({ _id: params.tid }, {
                $set: {
                    isEnd: '1'
                }
            })
            const result1 = await Comments.updateOne({ _id: params.cid }, {
                $set: {
                    isBest: '1'
                }
            })
            if (result.ok === 1 && result1.ok === 1) {
                const comment = await Comment.findByCid(params.cid)
                const result2 = await User.updateOne({ _id: comment.cuid }, { $inc: { favs: parseInt(post.fav) } })
                if (result2.ok === 1) {
                    ctx.body = {
                        code: 200,
                        msg: '设置成功'
                    }
                } else {
                    ctx.body = {
                        code: 500,
                        msg: '设置最佳答案-更新用户失败'
                    }
                }

            } else {
                ctx.body = {
                    code: 500,
                    msg: '设置失败',
                    data: { ...result, ...result1 }
                }
            }

            // 把积分制给采纳的用户
        } else {
            ctx.body = {
                code: 500,
                msg: '帖子已经结贴，无法重复设置'
            }
        }
    }
    async setHands(ctx) {
        const obj = await getJWTPayload(ctx.header.authorization)
        const params = ctx.query
        //  判断用户是否已经点赞
        const tmp = await CommentsHands.find({ cid: params.cid, uid: obj._id })
        if (tmp.length > 0) {

            ctx.body = {
                code: 500,
                msg: '您已经点赞，请勿重复点赞'
            }
            return
        }
        const newHands = new CommentsHands({
            cid: params.cid,
            uid: obj._id
        })
        const data = await newHands.save()

        const result = await Comments.updateOne({ _id: params.cid }, { $inc: { hands: 1 } })
        if (result.ok === 1) {
            ctx.body = {
                vode: 200,
                msg: '点赞成功',
                data: data
            }
        }
        else {
            ctx.body = {
                code: 500,
                msg: '保存点赞点赞记录失败'
            }
        }
    }
}
export default new CommentsController()