import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock, 
  Pill,
  Activity,
  Phone,
  Calendar
} from 'lucide-react'
import HeartWithBeat from '@/components/HeartWithBeat'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface MessageCardProps {
  message: Message
  isLatest?: boolean
}

interface ContentSection {
  type: 'paragraph' | 'heading' | 'list' | 'emergency' | 'medication' | 'section'
  content: string[]
  title: string
}

// Enhanced content parser for medical responses
const parseCardiacContent = (content: string): ContentSection[] => {
  const sections: ContentSection[] = []
  const lines = content.split('\n').filter(line => line.trim())
  
  let currentSection: ContentSection = { type: 'paragraph', content: [], title: '' }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Detect headings (lines that end with : or are in ALL CAPS)
    if (line.endsWith(':') || (line === line.toUpperCase() && line.length > 3 && line.length < 50)) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection)
      }
      currentSection = { 
        type: 'heading', 
        content: [line.replace(':', '')], 
        title: line.replace(':', '') 
      }
      continue
    }
    
    // Detect lists (lines starting with numbers, bullets, or dashes)
    if (line.match(/^[\d\-\*\•]\s+/) || line.match(/^\d+\.\s+/)) {
      if (currentSection.type !== 'list') {
        if (currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { type: 'list', content: [], title: '' }
      }
      currentSection.content.push(line.replace(/^[\d\-\*\•]\s+/, '').replace(/^\d+\.\s+/, ''))
      continue
    }
    
    // Detect emergency/important content
    if (line.toLowerCase().includes('emergency') || line.toLowerCase().includes('urgent') || 
        line.toLowerCase().includes('911') || line.toLowerCase().includes('call doctor')) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection)
      }
      sections.push({ type: 'emergency', content: [line], title: 'Important' })
      currentSection = { type: 'paragraph', content: [], title: '' }
      continue
    }
    
    // Detect medication mentions
    if (line.toLowerCase().includes('medication') || line.toLowerCase().includes('dose') || 
        line.toLowerCase().includes('pill') || line.toLowerCase().includes('mg') ||
        line.toLowerCase().includes('prescription')) {
      if (currentSection.type !== 'medication') {
        if (currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { type: 'medication', content: [], title: 'Medication Information' }
      }
      currentSection.content.push(line)
      continue
    }
    
    // Regular paragraph content
    if (currentSection.type === 'heading' && currentSection.content.length === 1) {
      // This is content under a heading
      currentSection.type = 'section'
      currentSection.content.push(line)
    } else if (currentSection.type !== 'list' && currentSection.type !== 'medication') {
      if (currentSection.type !== 'paragraph') {
        if (currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { type: 'paragraph', content: [], title: '' }
      }
      currentSection.content.push(line)
    } else {
      currentSection.content.push(line)
    }
  }
  
  if (currentSection.content.length > 0) {
    sections.push(currentSection)
  }
  
  return sections
}

const MessageCard: React.FC<MessageCardProps> = ({ message, isLatest = false }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const isAssistant = message.role === 'assistant'
  const isLongMessage = message.content.length > 300
  
  // Parse content for assistant messages
  const parsedSections = isAssistant ? parseCardiacContent(message.content) : []
  
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medication':
        return <Pill className="w-4 h-4 text-blue-500" />
      case 'heading':
      case 'section':
        return <Info className="w-4 h-4 text-medical-500" />
      case 'list':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Heart className="w-4 h-4 text-medical-500" />
    }
  }
  
  const getSectionStyles = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-50 border-red-200 border-l-4 border-l-red-500'
      case 'medication':
        return 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500'
      case 'section':
        return 'bg-medical-50 border-medical-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex",
        isAssistant ? 'justify-start' : 'justify-end'
      )}
    >
      <div className={cn(
        "flex max-w-xs lg:max-w-md xl:max-w-2xl",
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
          isAssistant
            ? 'bg-gradient-to-br from-accent-500 to-medical-500 mr-3' 
            : 'bg-medical-500 ml-3'
        )}>
          {isAssistant ? (
            <HeartWithBeat size="sm" heartColor="text-white" beatColor="text-red-400" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={cn(
          "relative rounded-2xl shadow-sm",
          isAssistant
            ? 'bg-white border border-gray-200 rounded-bl-md'
            : 'bg-medical-500 text-white rounded-br-md'
        )}>
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={cn(
                "text-sm font-medium",
                isAssistant ? 'text-gray-700' : 'text-white'
              )}>
                {isAssistant ? 'Cardiac Care Assistant' : 'You'}
              </span>
              {isAssistant && (
                <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              )}
            </div>
            {isAssistant && isLongMessage && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isExpanded ? 'Collapse message' : 'Expand message'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Message Body */}
          <div className="px-4 py-3">
            {isAssistant ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={isExpanded ? 'expanded' : 'collapsed'}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {parsedSections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "rounded-lg p-3 border",
                        getSectionStyles(section.type)
                      )}
                    >
                      {/* Section Header */}
                      {section.title && (
                        <div className="flex items-center space-x-2 mb-2">
                          {getSectionIcon(section.type)}
                          <h4 className="text-sm font-semibold text-gray-800">
                            {section.title}
                          </h4>
                        </div>
                      )}
                      
                      {/* Section Content */}
                      {section.type === 'list' ? (
                        <ul className="space-y-1">
                          {section.content.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-sm text-gray-700 leading-relaxed">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : section.type === 'heading' ? (
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {section.content[0]}
                        </h3>
                      ) : (
                        <div className="space-y-2">
                          {section.content.map((paragraph, pIndex) => (
                            <p key={pIndex} className="text-sm text-gray-700 leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {(!isExpanded && isLongMessage) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-2"
                    >
                      <button
                        onClick={() => setIsExpanded(true)}
                        className="text-sm text-medical-600 hover:text-medical-700 font-medium"
                      >
                        Click to read more...
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className="text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className={cn(
            "px-4 py-2 border-t flex items-center justify-between",
            isAssistant ? 'border-gray-100 bg-gray-50/50' : 'border-medical-400/20'
          )}>
            <div className="flex items-center space-x-2">
              <Clock className={cn(
                "w-3 h-3",
                isAssistant ? 'text-gray-400' : 'text-medical-200'
              )} />
              <span className={cn(
                "text-xs",
                isAssistant ? 'text-gray-500' : 'text-medical-100'
              )}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            
            {isAssistant && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">AI Assistant</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default MessageCard