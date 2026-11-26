import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FlaskConical, Activity, Cpu, Database,
  BookOpen, Settings, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, path: '/workspace' },
  { label: 'Image Studio', icon: FlaskConical, path: '/workspace/studio' },
  { label: 'Predictions', icon: Activity, path: '/workspace/predictions' },
  { label: 'Model Lab', icon: Cpu, path: '/workspace/model' },
  { label: 'Dataset', icon: Database, path: '/workspace/dataset' },
  { label: 'Research Notes', icon: BookOpen, path: '/workspace/notes' },
  { label: 'Settings', icon: Settings, path: '/workspace/settings' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-screen bg-surface border-r border-border shrink-0 overflow-hidden z-20"
      style={{ minWidth: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #C6FF4A, #9B7BFF)' }}>
          <span className="text-bg font-display font-bold text-xs">TF</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display font-bold text-white text-sm tracking-widest"
            >
              TRACEFORM
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/workspace' && location.pathname.startsWith(item.path))
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group
                  ${active
                    ? 'bg-lime/10 text-lime border border-lime/20'
                    : 'text-muted hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-lime hover:border-lime transition-colors z-30"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Bottom tag */}
      <div className="px-4 pb-4 border-t border-border pt-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted"
            >
              v2.0.0 · YOLO11 Suite
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
