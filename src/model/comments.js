import mongoose from '@/config/DBHelpler'
import moment from 'dayjs'

const Schema = mongoose.Schema
const CommentsSchema = new Schema({
    tid: { type: String, ref: 'post' },
    uid: { type: String, ref: 'users' },
    cuid: { type: String, ref: 'users' },
    content: { type: String },
    created: { type: Date },
    hands: { type: Number, default: 0 },
    status: { type: String, default: '1' },
    isRead: { type: String, default: '0' },
    isBest: { type: String, default: '0' }
}, { toJSON: { virtuals: true } })
CommentsSchema.pre('save', function (next) {
    this.created = moment().format('YYYY-MM-DD HH:mm:ss')
    next()
})
CommentsSchema.statics = {
    findByTid: function (id) {
        return this.find({ tid: id })
    },
    findByCid: function (id) {
        return this.findOne({ _id: id })
    },
    getCommentsList: function (id, page, limit) {
        return this.find({ tid: id }).populate({
            path: 'cuid',
            select: '_id name pic isVip',
            match: { status: { $eq: '0' } }
        }).populate({
            path: 'tid',
            select: '_id title status'
        }).skip(page * limit).limit(limit)
    },
    queryCount: function (id) {
        return this.find({ tid: id }).countDocuments()
    }
}

const Comments = mongoose.model('comments', CommentsSchema)
export default Comments
