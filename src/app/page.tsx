"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inter } from 'next/font/google'
import LoanPredictorApp from '@/components/loan-predictor-app'

const inter = Inter({ subsets: ['latin'] })

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className={`${inter.className} min-h-screen bg-background flex items-center justify-center`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">LoanPredictor</h2>
          <p className="text-muted-foreground">Loading your financial future...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={inter.className}>
      <LoanPredictorApp />
    </div>
  )
}