import React from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Check } from "@phosphor-icons/react"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe size={16} />
          <span className="hidden sm:inline">
            {language === 'ar' ? 'العربية' : 'English'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')}
          className="gap-2"
        >
          {language === 'ar' && <Check size={16} className="text-primary" />}
          <span className={language === 'ar' ? 'text-primary' : ''}>
            العربية
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className="gap-2"
        >
          {language === 'en' && <Check size={16} className="text-primary" />}
          <span className={language === 'en' ? 'text-primary' : ''}>
            English
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}