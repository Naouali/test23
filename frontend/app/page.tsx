'use client'

import { useState, useEffect } from 'react'
import ClientOnly from '../components/ClientOnly'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import IncentiveParameters from '../components/IncentiveParameters'
import PerformanceData from '../components/PerformanceData'
import Teams from '../components/Teams'

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [activeTeam, setActiveTeam] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.hash.slice(1) || 'dashboard';
      if (['dashboard', 'incentives', 'performance', 'teams'].includes(path)) {
        setActiveSection(path);
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleNavigation);
    // Handle initial navigation
    handleNavigation();

    return () => {
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  // Load saved state after mounting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSection = localStorage.getItem('activeSection');
      const savedTeam = localStorage.getItem('activeTeam');
      
      if (savedSection && ['dashboard', 'incentives', 'performance', 'teams'].includes(savedSection)) {
        setActiveSection(savedSection);
      }
      
      if (savedTeam) {
        setActiveTeam(savedTeam);
      }
    }
  }, []);

  // Save activeSection to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && activeSection) {
      localStorage.setItem('activeSection', activeSection);
    }
  }, [activeSection])

  // Save activeTeam to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeTeam) {
        localStorage.setItem('activeTeam', activeTeam);
      } else {
        localStorage.removeItem('activeTeam');
      }
    }
  }, [activeTeam])

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'incentives':
        return <IncentiveParameters />
      case 'performance':
        return <PerformanceData activeTeam={activeTeam} />
      case 'teams':
        return <Teams activeTeam={activeTeam} setActiveTeam={setActiveTeam} />
      default:
        return <Dashboard />
    }
  }

  return (
    <ClientOnly fallback={
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-white shadow-lg border-r border-gray-200"></div>
        <div className="flex-1">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
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
    </ClientOnly>
  )
} 