'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Dashboard from '../components/Dashboard'
import IncentiveParameters from '../components/IncentiveParameters'
import PerformanceData from '../components/PerformanceData'
import Teams from '../components/Teams'

export default function Home() {
  const [activeSection, setActiveSection] = useState(() => {
    // Try to get the saved section from localStorage, default to 'dashboard'
    if (typeof window !== 'undefined') {
      const savedSection = localStorage.getItem('activeSection');
      // Check if we have a valid section saved
      if (savedSection && ['dashboard', 'incentives', 'performance', 'teams'].includes(savedSection)) {
        return savedSection;
      }
    }
    return 'dashboard';
  })

  const [activeTeam, setActiveTeam] = useState<string | null>(() => {
    // Try to get the saved team from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeTeam');
    }
    return null;
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Save activeSection to localStorage whenever it changes
  useEffect(() => {
    if (activeSection) {
      localStorage.setItem('activeSection', activeSection);
    }
  }, [activeSection])

  // Save activeTeam to localStorage whenever it changes
  useEffect(() => {
    if (activeTeam) {
      localStorage.setItem('activeTeam', activeTeam);
    } else {
      localStorage.removeItem('activeTeam');
    }
  }, [activeTeam])

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