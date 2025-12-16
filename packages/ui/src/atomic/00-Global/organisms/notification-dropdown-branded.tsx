'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { BellIcon } from 'lucide-react'

interface Notification {
  id: string
  text: string
  time: string
  unread?: boolean
}

interface NotificationItemProps {
  text: string
  time: string
  unread?: boolean
}

function NotificationItem({ text, time, unread }: NotificationItemProps) {
  return (
    <div
      className="flex gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
      role="menuitem"
      tabIndex={0}
    >
      {unread && (
        <div className="w-2 h-2 rounded-full bg-[#FFD700] mt-1 flex-shrink-0" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{text}</p>
        <p className="text-xs text-white/60 mt-0.5">
          {time}
        </p>
      </div>
    </div>
  )
}

export interface NotificationDropdownProps {
  /**
   * Array of notifications to display
   */
  notifications?: Notification[]
  /**
   * Unread count
   */
  unreadCount?: number
}

export function NotificationDropdown({
  notifications = [
    {
      id: '1',
      text: 'New ritual starting in 10 minutes',
      time: '2m ago',
      unread: true,
    },
    {
      id: '2',
      text: 'Alex commented on your post',
      time: '1h ago',
      unread: true,
    },
    {
      id: '3',
      text: 'CS Club posted a new event',
      time: '3h ago',
      unread: false,
    },
  ],
  unreadCount = 2,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <BellIcon className="w-5 h-5 text-white/70" aria-hidden="true" />

        {/* Unread badge - HIVE gold */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FFD700] text-black text-xs font-bold flex items-center justify-center"
          >
            {unreadCount}
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-white/[0.08] bg-black shadow-lg z-50"
              role="menu"
              aria-label="Notifications menu"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Notifications
                </h3>

                {/* Clean list */}
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      text={notification.text}
                      time={notification.time}
                      unread={notification.unread}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
