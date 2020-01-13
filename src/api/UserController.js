import SignRecord from '../model/SignRecord'
import { getJWTPayload } from '../common/Utils'
import User from '../model/User'
import moment from 'dayjs'
import send from '@/config/MailConfig'
import uuid from 'uuid/v4'
import jwt from 'jsonwebtoken'
import { setValue, getValue } from '@/config/RedisConfig'
import config from '@/config'
class UserController {
  async userSign (ctx) {
    const obj = await getJWTPayload(ctx.header.authorization)
    const record = await SignRecord.findByUid(obj._id)
    const user = await User.findById(obj._id)
    let newRecord = {}
    let result = {}
    if (record !== null) {
      console.log(moment(record.created).format('YYYY-MM-DD'))
      console.log(moment().format('YYYY-MM-DD'))
      if (moment(record.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        return ctx.body = {
          code: 500,
          lastSign: record.created,
          msg: '用户已经签到',
          favs: user.favs,
          count: user.count
        }
      } else {
        let count = user.count
        let fav = 0
        if (moment(record.created).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
          count += 1
          if (count < 5) {
            fav = 5
          } else if (count >= 5 && count < 15) {
            fav = 10
          } else if (count >= 15 && count < 30) {
            fav = 15
          } else if (count >= 30 && count < 100) {
            fav = 20
          } else if (count >= 100 && count < 365) {
            fav = 30
          } else if (count >= 365) {
            fav = 50
          }
          await User.updateOne({ _id: obj._id }, {
            $inc: {
              favs: fav, count: 1
            }
          })
          result = {
            favs: user.favs + fav,
            count: user.count + 1
          }
        } else {
          fav = 5
          await User.updateOne({ _id: obj._id }, { $set: { count: 1 } }, { $inc: { favs: fav } })
          result = {
            favs: user.favs + fav,
            count: 1
          }
        }
        newRecord = new SignRecord({
          uid: obj._id,
          favs: fav
        })
        await newRecord.save()
      }
    } else {
      await User.updateOne({
        _id: obj._id
      }, {
        $set: { count: 1 },
        $inc: { fav: 5 }
      })

      newRecord = new SignRecord({
        uid: obj._id,
        favs: 5
      })
      await newRecord.save()
      result = {
        favs: user.favs + 5,
        count: 1
      }
    }
    ctx.body = {
      code: 200,
      msg: '请求成功',
      ...result,
      lastSign: newRecord.created
    }
  }

  //更新用户基本信息接口
  async updateUserInfo (ctx) {
    const { body } = ctx.request
    const obj = await getJWTPayload(ctx.header.authorization)
    //判断用户是否修改了邮箱
    const user = await User.findOne({ _id: obj._id })
    let msg = ''
    if (body.username && body.username !== user.username) {
      //用户修改了邮箱
      //发送reset邮件
      const tmpUser = await User.findOne({ username: body.username })
      if (tmpUser && tmpUser.password) {
        ctx.body = {
          code: 501,
          msg: '邮箱已经注册'
        }
        return
      }
      const key = uuid()
      setValue(key, jwt.sign({ _id: obj._id }, config.JWT_SECRET, {
        expiresIn: '30m'
      }))
      let result = await send({
        type: 'email',
        data: {
          username: body.username,
          key: key,
        },
        code: '',
        expire: moment()
          .add(30, 'minutes')
          .format('YYYY-MM-DD HH:mm:ss'),
        email: user.username,
        user: user.name,
      })
      msg = '更新基本资料成功，账号修改需要邮件确认，请查收邮件!'

    }
    const arr = ['username', 'mobile', 'password']
    arr.map(item => {
      delete body[item]
    })
    const result = await User.updateOne({ _id: obj._id }, body)
    console.log(result)
    if (result.n === 1 && result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: msg === '' ? '更新成功' : msg
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新失败'
      }
    }


  }

  //更新用户名
  async updateUsername (ctx) {
    const body = ctx.query
    if (body.key) {
      const token = await getValue(body.key)
      const obj = getJWTPayload('Bearer ' + token)
      await User.updateOne({ _id: obj._id }, {
        username: body.username
      })
      ctx.body = {
        code: 200,
        msg: '更新用户名称'
      }
    }
  }
}
export default new UserController()
