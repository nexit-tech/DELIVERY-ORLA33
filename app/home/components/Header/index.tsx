'use client'
import { useState, useEffect } from 'react' // useContext e ThemeContext removidos
import { Menu, User, ShoppingCart, Package, X } from 'lucide-react' // Sun e Moon removidos
import styles from './styles.module.css'
// Importação do ThemeContext removida

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  // Lógica do themeContext removida

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) setIsScrolled(true)
      else setIsScrolled(false)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMenuOpen])

  // Verificação if (!themeContext) removida
  // Destructuring { theme, toggleTheme } removido

  return (
    <>
      <header
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${
          isMenuOpen ? styles.headerOpen : ''
        }`}
      >
        <button
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <div className={styles.menuIconWrapper}>
            <Menu size={24} strokeWidth={2.5} className={`${styles.menuIcon} ${isMenuOpen ? styles.menuIconHidden : ''}`} />
            <X size={24} strokeWidth={2.5} className={`${styles.closeIcon} ${isMenuOpen ? styles.closeIconVisible : ''}`} />
          </div>
        </button>

        {/* --- CONTÊINER DOS ÍCONES DA DIREITA --- */}
        <div className={styles.actionsContainer}>
          {/* Botão de Carrinho (visível quando o menu está FECHADO) */}
          <button
            className={`${styles.iconButton} ${isMenuOpen ? styles.iconHidden : styles.iconVisible}`}
            aria-label="Carrinho"
          >
            <ShoppingCart size={22} strokeWidth={2.5} />
            <span className={styles.cartBadge}>2</span>
          </button>

          {/* Botão de Tema (REMOVIDO) */}
        </div>
      </header>

      {/* O resto do componente continua igual */}
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu} />}
      <div
        className={`${styles.menuDropdown} ${isMenuOpen ? styles.menuOpen : ''}`}
      >
        <div className={styles.menuHeader}>
          <img
            src="/images/orla33semfundo.png"
            alt="Orla 33"
            className={styles.menuLogo}
          />
        </div>
        <div className={styles.menuItems}>
          <button className={styles.menuItem} onClick={closeMenu}>
            <div className={styles.menuItemIcon}><ShoppingCart size={24} strokeWidth={2.5} /></div>
            <span className={styles.menuItemText}>Carrinho</span>
            <span className={styles.menuBadge}>2</span>
          </button>
          <button className={styles.menuItem} onClick={closeMenu}>
            <div className={styles.menuItemIcon}><Package size={24} strokeWidth={2.5} /></div>
            <span className={styles.menuItemText}>Acompanhar Pedido</span>
          </button>
          <button className={styles.menuItem} onClick={closeMenu}>
            <div className={styles.menuItemIcon}><User size={24} strokeWidth={2.5} /></div>
            <span className={styles.menuItemText}>Perfil</span>
          </button>
        </div>
      </div>
    </>
  )
}