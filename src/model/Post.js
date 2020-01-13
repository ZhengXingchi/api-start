import mongoose from '@/config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const PostSchema = new Schema({
  'uid': { type: String, ref: "users" },
  'title': { type: String },
  'content': { type: String },
  'created': { type: Date },
  'catalog': { type: String },
  'fav': { type: String },
  'isEnd': { type: String },
  'reads': { type: Number },
  'answer': { type: Number },
  'status': { type: String },
  'isTop': { type: String },
  'sort': { type: String },
  'tags': { type: Array }
})

PostSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

PostSchema.statics = {
  getList: function (options, sort, page, limit) {
    return this.find(options)
      .sort({ [sort]: -1 })
      .skip(page * limit)
      .limit(limit)
      .populate({
        path: "uid",
        select: "name  isVip pic"
      })
  },
  getTopWeek: function () {
    return this.find({
      "created": {
        $gte: moment().subtract(7, 'days')

      }
    }, {
      answer: 1,
      title: 1
    }).sort({ 'answer': -1 })
      .limit(15)
  }
}

const PostModel = mongoose.model('post', PostSchema)

export default PostModel