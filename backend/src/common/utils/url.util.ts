export class UrlUtil {
  /**
   * Obtiene el dominio/base URL configurado del backend desde las variables de entorno,
   * utilizando APP_BASE_URL, HOST o fallback a http://localhost:3000 sin barra final.
   */
  static getBaseUrl(): string {
    const raw = process.env.APP_BASE_URL || process.env.HOST || 'http://localhost:3000';
    return raw.replace(/\/+$/, '');
  }

  /**
   * Transforma una ruta relativa de imagen o URL en una URL absoluta resoluble.
   * Ejemplos:
   *  - '/uploads/products/img1.webp' => 'http://localhost:3000/uploads/products/img1.webp'
   *  - 'https://cdn.example.com/img1.webp' => 'https://cdn.example.com/img1.webp'
   */
  static resolveImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = UrlUtil.getBaseUrl();
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  }
}
