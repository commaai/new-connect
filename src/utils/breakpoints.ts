const MIN_SIZE = {
  xs: 0, // phone
  sm: 500, // tablet
  md: 900, // small laptop
  lg: 1200, // desktop
  xl: 1536, // large screen
}

export type Size = keyof typeof MIN_SIZE

function up(size: Size) {
  return `@media (min-width:${MIN_SIZE[size]}px)`
}

function down(size: Size) {
  const width = MIN_SIZE[size]
  const ubound = Object.values(MIN_SIZE).find((val) => val > width)
  if (ubound && ubound > 0) {
    return `@media (max-width:${ubound}px)`
  } else {
    return `@media (max-width:${MIN_SIZE.xl * 1.2}px)`
  }
}

function only(size: Size) {
  const excludeup = up(size).replace(/^@media( ?)/m, '')
  const excludedown = down(size).replace(/^@media( ?)/m, '')
  return `@media ${excludeup} and ${excludedown}`
}

export default { values: MIN_SIZE, up, down, only }

