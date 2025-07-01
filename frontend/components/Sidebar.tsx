'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  Users, 
  ChevronDown,
  ChevronRight,
  Building2,
  Scale,
  CreditCard,
  Headphones,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  activeTeam: string | null
  setActiveTeam: (team: string | null) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export default function Sidebar({ 
  activeSection, 
  setActiveSection, 
  activeTeam, 
  setActiveTeam,
  collapsed,
  setCollapsed
}: SidebarProps) {
  const [teamsExpanded, setTeamsExpanded] = useState(false)

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '#dashboard'
    },
    {
      id: 'incentives',
      label: 'Incentive Parameters',
      icon: Settings,
      href: '#incentives'
    },
    {
      id: 'performance',
      label: 'Performance Data',
      icon: BarChart3,
      href: '#performance'
    }
  ]

  const teamItems = [
    {
      id: 'legal',
      label: 'Legal Team',
      icon: Scale,
      description: 'Legal and compliance team'
    },
    {
      id: 'loan',
      label: 'Loan Team',
      icon: CreditCard,
      description: 'Loan processing and underwriting team'
    },
    {
      id: 'servicing',
      label: 'Servicing Team',
      icon: Headphones,
      description: 'Customer service and loan servicing team'
    }
  ]

  const handleTeamClick = (teamId: string) => {
    setActiveSection('teams')
    setActiveTeam(teamId)
    window.location.hash = 'teams'
  }

  const handleNavigationClick = (sectionId: string) => {
    setActiveSection(sectionId)
    window.location.hash = sectionId
  }

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ease-in-out ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${collapsed ? 'px-2' : 'px-6'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary-600 flex-shrink-0" />
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bonus Calc</h1>
                <p className="text-sm text-gray-500">Performance & Rewards</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`pb-4 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className="space-y-1 mt-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleNavigationClick(item.id)}
                className={`sidebar-item w-full ${
                  activeSection === item.id ? 'active' : ''
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                {!collapsed && item.label}
              </button>
            )
          })}

          {/* Teams Section */}
          <div className="pt-4">
            <button
              onClick={() => !collapsed && setTeamsExpanded(!teamsExpanded)}
              className={`sidebar-item w-full ${
                activeSection === 'teams' ? 'active' : ''
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? 'Teams' : undefined}
            >
              <Users className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && (
                <>
                  Teams
                  {teamsExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </>
              )}
            </button>

            {!collapsed && teamsExpanded && (
              <div className="ml-6 mt-2 space-y-1">
                {teamItems.map((team) => {
                  const Icon = team.icon
                  return (
                    <button
                      key={team.id}
                      onClick={() => handleTeamClick(team.id)}
                      className={`sidebar-item w-full text-sm ${
                        activeSection === 'teams' && activeTeam === team.id ? 'active' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {team.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Collapsed Teams - Show as individual buttons */}
            {collapsed && (
              <div className="mt-2 space-y-1">
                {teamItems.map((team) => {
                  const Icon = team.icon
                  return (
                    <button
                      key={team.id}
                      onClick={() => handleTeamClick(team.id)}
                      className={`sidebar-item w-full justify-center px-2 ${
                        activeSection === 'teams' && activeTeam === team.id ? 'active' : ''
                      }`}
                      title={team.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
} 