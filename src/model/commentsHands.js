import mongoose from '../config/DBHelpler'
import moment from 'dayjs'
import webpackNodeExternals from 'webpack-node-externals'

const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  // 'cid': { type: String},
  cid: { type: String },
  uid: { type: String },
  created: { type: Date }
})

CommentsSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})
CommentsSchema.post('save', function (error, doc,next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicated key error'))
  }else{
    next(error)
  }
})
CommentsSchema.statics = {
  findByCid: function (id) {
      return this.findOne({ cid: id })
  }
}
const CommentsHands = mongoose.model('comments_hands', CommentsSchema)
export default CommentsHands