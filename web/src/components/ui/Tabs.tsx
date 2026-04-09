import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  activeTab?: string
  onChange?: (tabId: string) => void
  children?: (activeTab: string) => ReactNode
}

export default function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActive,
  onChange,
  children,
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(defaultTab ?? tabs[0]?.id ?? '')
  const active = controlledActive ?? internalActive

  function handleClick(tabId: string) {
    setInternalActive(tabId)
    onChange?.(tabId)
  }

  return (
    <div>
      <div className="cm-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            className={`cm-tab ${active === tab.id ? 'cm-tab--active' : ''}`}
            onClick={() => handleClick(tab.id)}
          >
            {tab.icon && <span className="cm-tab__icon">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="cm-tab__badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      {children && <div key={active} className="cm-tab-panel">{children(active)}</div>}
    </div>
  )
}
