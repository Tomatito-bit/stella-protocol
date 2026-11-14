// Lets plain Node import the app's extension-less modules
import { registerHooks } from 'node:module'
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx) } catch (e) { if (spec.startsWith('.')) return next(spec + '.js', ctx); throw e } } })
