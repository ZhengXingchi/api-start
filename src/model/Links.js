import mongoose from '@/config/DBHelpler'
import moment from 'dayjs'
const Schema = mongoose.Schema

const LinksSchema = new Schema({
  title: { type: String, default: "" },
  link: { type: String, default: "" },
  type: { type: String, default: "link" },
  created: { type: Date },
  isTop: { type: String, default: "" },
  sort: { type: String, default: "" }
})



const LinksModel = mongoose.model('links', LinksSchema)
LinksSchema.pre("save", function (next) {
  this.created = moment()
  next()
})
export default LinksModel
