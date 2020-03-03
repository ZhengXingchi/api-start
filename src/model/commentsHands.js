import mongoose from '../config/DBHelpler'
import moment from 'dayjs'

const Schema = mongoose.Schema

const CommentsSchema = new Schema({
  // 'cid': { type: String},
  cid: { type: String },
  uid: { type: String },
  created: { type: Date }
})
const CommentsHands = mongoose.model('comments_hands', CommentsSchema)
export default CommentsHands