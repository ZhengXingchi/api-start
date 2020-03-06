import Post from '@/model/Post'
import User from '@/model/User'
import Links from '@/model/Links'
// import fs, { rename } from 'fs'
import fs from 'fs'
import uuid from 'uuid/v4'
import moment from 'dayjs'
import config from '@/config'
import { dirExists } from '@/common/Utils'
import mkdir from 'make-dir'
import { checkCode ,getJWTPayload,rename } from '@/common/Utils'
class ContentController {
  constructor() { }
  async getPostList(ctx) {
    // const post = new Post({
    //   title: 'test title',
    //   content: 'test content',
    //   catalog: 'advice',
    //   fav: 20,
    //   isEnd: '0',
    //   reads: '0',
    //   answer: '0',
    //   status: '0',
    //   isTop: '0',
    //   sort: '0',
    //   tags: []
    // })
    // const tmp = await post.save()
    // console.log(tmp)
    const body = ctx.query
    let options = {}
    const sort = body.sort ? body.sort : 'created'
    const page = body.page ? parseInt(body.page) : 0
    const limit = body.limit ? parseInt(body.limit) : 20
    if (typeof body.catalog !== 'undefined' && body.catalog !== '') {
      options.catalog = body.catalog
    }
    if (typeof body.isTop !== 'undefined') {
      options.isTop = body.isTop
    }
    if (typeof body.status !== 'undefined' && body.status !== '') {
      options.isEnd = body.status
    }

    if (typeof body.tag !== 'undefined' && body.tag !== '') {
      options.tags = { $elemMatch: { name: body.tag } }
    }
    const result = await Post.getList(options, sort, page, limit)
    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
    }
  }

  async getLinks(ctx) {
    const result = await Links.find({ type: 'links' })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getTips(ctx) {
    const result = await Links.find({ type: 'tips' })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getTopWeek(ctx) {
    const result = await Post.getTopWeek()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  // 上传图片
  async uploadImg(ctx) {
    const file = ctx.request.files.file
    // 图片名称、图片格式、存储的位置，返回前台可以读取路径
    const ext = file.name.split('.').pop()
    const dir = `${config.uploadPath}/${moment().format('YYYYMMDD')}`
    console.log('1', ext)
    console.log('2', dir)
    console.log('3', config.uploadPath)
    //判断路径是否存在
    // await dirExists(dir)
    await mkdir(dir)
    //存储文件到指定的路径
    //给文件一个唯一的名称
    const picname = uuid()
    const destPath = `${dir}/${picname}.${ext}`
    const reader = fs.createReadStream(file.path, {
      highWaterMark: 100 * 1024 * 1024
    })
    console.log('file.path', file.path)
    const upStream = fs.createWriteStream(destPath)
    const filePath = `/${moment().format('YYYYMMDD')}/${picname}.${ext}`
    //method1
    reader.pipe(upStream)
    //method2
    // const stat=fs.statSync(file.path)
    // console.log('stat.totalSize',stat.size)
    // let totalLength=0
    // reader.on('data',(chunk)=>{
    //   totalLength += chunk.length
    //   console.log('=======',totalLength)
    //   if(upStream.write(chunk)===false){
    //     reader.pause()
    //   } 
    // })
    // upStream.on('drain',()=>{
    //   reader.resume()
    // })
    // reader.on('end',()=>{
    //   console.log('end=======',totalLength)
    //   upStream.end()

    // })
    // console.log(totalLength)
    ctx.body = {
      code: 200,
      msg: '图片上传成功',
      data: filePath
    }
  }

  // 添加新帖
  async addPost(ctx) {
    const { body } = ctx.request
    let sid = body.sid
    let code = body.code
    // 验证图片验证码的时效性、正确性
    let result = await checkCode(sid, code)
    if (result) {
      const obj = await getJWTPayload(ctx.header.authorization)
      const user = await User.findById({ _id: obj._id })
      if (user.favs < body.fav) {
        ctx.body = {
          code: 501,
          msg: '积分不足'
        }
        return
      } else {
        await User.updateOne({ _id: obj._id }, { $inc: { favs: -body.fav } })
      }
      const newPost = new Post(body)
      newPost.uid = obj._id
      const result = await newPost.save()
      ctx.body = {
        code: 200,
        msg: '成功的保存的文章',
        data: result
      }
    } else {
      // 图片验证码验证失败
      ctx.body = {
        code: 500,
        msg: '图片验证码验证失败'
      }
    }
  }

  async updatePost(ctx){
    console.log('11111111111111111')
    const { body } = ctx.request
    let sid = body.sid
    let code = body.code
    // 验证图片验证码的时效性、正确性
    let result = await checkCode(sid, code)
    if (result) {
      const obj = await getJWTPayload(ctx.header.authorization)
    // 判断帖子作者是否为本人
    const post = await Post.findOne({_id:body.tid})
     // 判断帖子是否结贴
    if(post.uid === obj._id && post.isEnd === '0'){
      const result = await Post.updateOne({_id:body.tid},body)
      if(result.ok === 1){
        ctx.body = {
          code: 200,
          msg: '更新帖子成功',
          data: result
        }
      }else{
        ctx.body = {
          code: 500,
          msg: '编辑帖子，更新失败',
          data: result
        }
      }
   
    }else{
      ctx.body={
        code:401,
        mag:'没有操作的权限'
      }
    }
    } else {
      // 图片验证码验证失败
      ctx.body = {
        code: 500,
        msg: '图片验证码验证失败'
      }
    }
  }

  async getPostDetail(ctx) {
    const params = ctx.query
    if (!params.tid) {
      ctx.body = {
        msg: '文章标题为空',
        code: 500
      }
      return
    }
     
    const post = await Post.findByTid(params.tid)
    // 更新文章阅读计数
    const result = await Post.updateOne({_id:params.tid},{$inc:{reads:1}})
    if(post._id && result.ok === 1){
      const result1 = rename(post.toJSON(),'uid','user')
      ctx.body = {
        code: 200,
        data: result1,
        msg:'查询文章详情成功'
      }
    }else{
      ctx.body = {
        code: 500,
        msg:'查询文章详情成功'
      }
    }
  }
}

export default new ContentController()
