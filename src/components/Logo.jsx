import { cn } from '../utils/cn.js'

export function Logo({ className, ...props }) {
  return <img src="/logo.png" alt="Bodymax" className={cn('object-contain', className)} {...props} />
}

export default Logo
