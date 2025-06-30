'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import IncentiveParameters from '../components/IncentiveParameters'
import PerformanceData from '../components/PerformanceData'
import Teams from '../components/Teams'

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [activeTeam, setActiveTeam] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'incentives':
        return <IncentiveParameters />
      case 'performance':
        return <PerformanceData />
      case 'teams':
        return <Teams activeTeam={activeTeam} setActiveTeam={setActiveTeam} />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        activeTeam={activeTeam}
        setActiveTeam={setActiveTeam}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <main className="flex-1 overflow-auto transition-all duration-300 ease-in-out">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  )
} 