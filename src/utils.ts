/**
 * @description Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * @description Convert kebab-case to camelCase
 */
export function kebabToCamel(str:string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
