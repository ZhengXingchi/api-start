import combineRoutes from 'koa-combine-routers'

// import publicRouter from './modules/publicRouter'
// import loginRouter from './modules/loginRouter'
// import userRouter from './modules/userRouter'
const moduleFiles = require.context('./modules', true, /\.js$/)
const modules = moduleFiles.keys().reduce((items, path) => {
  items.push(moduleFiles(path).default)
  return items
}, [])
// export default combineRoutes(publicRouter, loginRouter, userRouter)
export default combineRoutes(modules)
