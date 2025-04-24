export function getCssColors(): {
  app: string
  panel: string
  info: string
  special: string
  text: string
} {
  const styles = getComputedStyle(document.documentElement)
  return {
    app: styles.getPropertyValue('--color-app'),
    panel: styles.getPropertyValue('--color-panel'),
    info: styles.getPropertyValue('--color-info'),
    special: styles.getPropertyValue('--color-special'),
    text: styles.getPropertyValue('--color-text'),
  }
}

export const scrollToElement = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
