import { defineConfig, presetIcons, presetTypography, presetUno } from 'unocss'

export default defineConfig({
  dark: 'class',
  theme: {
    colors: {
      'app': '#050914',
      'shell': '#09101e',
      'surface': '#0a0f1e',
      'surface-2': '#10141c',
      'line': 'rgba(255,255,255,0.08)',
      'soft': 'rgba(255,255,255,0.06)',
      'muted': 'rgba(196,205,222,0.68)',
      'text': '#f5f7ff',
      'accent': '#85b6ff',
      'accent2': '#8bd6ff',
      'gold': '#ffcf70',
    },
    borderRadius: {
      panel: '24px',
      tile: '22px',
      card: '20px',
      pill: '999px',
    },
    boxShadow: {
      glass: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      glow: '0 0 24px rgba(117,210,255,0.45)',
    },
    fontFamily: {
      sans: '"Segoe UI", "Noto Sans KR", sans-serif',
    },
  },
  shortcuts: {
    'page-grid': 'grid gap-4 md:gap-5',
    'panel':
      'border border-line rounded-panel bg-[linear-gradient(180deg,rgba(16,20,28,0.96),rgba(9,12,18,0.96))] shadow-glass backdrop-blur-[18px]',
    'panel-soft':
      'border border-[rgba(255,255,255,0.07)] rounded-panel bg-[rgba(10,15,30,0.78)] backdrop-blur-[18px]',
    'card-tile':
      'border border-line rounded-tile bg-[linear-gradient(180deg,rgba(16,20,28,0.96),rgba(9,12,18,0.96))] shadow-glass',
    'stat-card':
      'border border-line rounded-card bg-[rgba(10,15,30,0.78)] backdrop-blur-[18px]',
    'chip':
      'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-pill bg-[rgba(255,255,255,0.07)] text-[0.82rem] leading-none text-[rgba(245,247,255,0.88)] align-middle',
    'chip-caution':
      'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-pill border border-[rgba(255,154,102,0.22)] bg-[rgba(255,138,92,0.12)] text-[0.82rem] leading-none text-[rgba(255,228,214,0.94)] align-middle',
    'operator-stars':
      'shrink-0 text-[0.7rem] sm:text-[0.82rem] tracking-[0.02em] sm:tracking-[0.08em] leading-none whitespace-nowrap',
    'operator-stars-overlay':
      'absolute left-1/2 top-2 z-2 -translate-x-1/2 shrink-0 text-[0.68rem] sm:text-[0.8rem] tracking-[0.02em] sm:tracking-[0.06em] leading-none whitespace-nowrap',
    'top-bar-shell':
      'border border-[rgba(255,255,255,0.08)] rounded-[22px] bg-[linear-gradient(180deg,rgba(8,12,24,0.95),rgba(8,12,24,0.78))] px-3.5 py-3 shadow-glass backdrop-blur-[18px]',
    'top-bar-icon':
      'inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-[rgba(235,240,255,0.88)] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.1)]',
    'action-btn':
      'inline-flex items-center justify-center w-fit px-4 py-2.5 rounded-[14px] border border-[rgba(103,158,255,0.32)] bg-[rgba(89,132,255,0.1)] text-[#dbe8ff] transition-colors duration-200 hover:bg-[rgba(89,132,255,0.18)]',
    'ghost-link':
      'inline-flex items-center gap-1.5 w-fit border-0 bg-transparent p-0 text-[rgba(235,240,255,0.86)] transition-colors duration-200 hover:text-white',
    'section-title': 'm-0 text-[1.45rem] leading-tight font-700 text-text',
    'eyebrow': 'm-0 text-[0.78rem] tracking-[0.12em] uppercase text-muted',
    'muted-copy': 'm-0 text-muted',
    'shell-wrap': 'w-full max-w-[72rem] mx-auto px-4',
  },
  presets: [
    presetUno(),
    presetIcons(),
    presetTypography(),
  ],
})
