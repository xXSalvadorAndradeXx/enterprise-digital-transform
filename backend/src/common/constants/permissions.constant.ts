export interface PermissionDefinition {
  code: string;
  description: string;
}

export const PERMISSIONS_CATALOG: PermissionDefinition[] = [
  // Módulo de Usuarios (Equipo)
  { code: 'users:create', description: 'Permite crear nuevos usuarios en el sistema' },
  { code: 'users:read', description: 'Permite visualizar la lista y detalles de usuarios' },
  { code: 'users:update', description: 'Permite modificar la información de los usuarios' },
  { code: 'users:delete', description: 'Permite realizar el borrado lógico de usuarios' },
  { code: 'users:assign-roles', description: 'Permite asignar roles a los usuarios' },

  // Módulo de Roles
  { code: 'roles:create', description: 'Permite crear nuevos roles de usuario' },
  { code: 'roles:read', description: 'Permite visualizar los roles y sus permisos asociados' },
  { code: 'roles:update', description: 'Permite modificar roles y su asignación de permisos' },
  { code: 'roles:delete', description: 'Permite eliminar roles que no sean de sistema' },

  // Módulo de Permisos
  { code: 'permissions:read', description: 'Permite listar los permisos disponibles en el sistema' },

  // Módulo de Catálogo / Productos
  { code: 'products:create', description: 'Permite agregar nuevos productos al catálogo' },
  { code: 'products:read', description: 'Permite visualizar productos en el panel administrativo' },
  { code: 'products:update', description: 'Permite editar la información y stock de los productos' },
  { code: 'products:delete', description: 'Permite realizar el borrado lógico de productos' },

  // Módulo de Categorías
  { code: 'categories:create', description: 'Permite crear nuevas categorías de productos' },
  { code: 'categories:read', description: 'Permite visualizar las categorías de productos' },
  { code: 'categories:update', description: 'Permite editar información de categorías' },
  { code: 'categories:delete', description: 'Permite eliminar categorías de productos' },

  // Módulo de Proveedores (Provedor)
  { code: 'providers:create', description: 'Permite registrar nuevos proveedores en el ERP' },
  { code: 'providers:read', description: 'Permite visualizar el listado y detalles de proveedores' },
  { code: 'providers:update', description: 'Permite actualizar información de proveedores' },
  { code: 'providers:delete', description: 'Permite eliminar proveedores' },

  // Módulo de Compras a Proveedores (compra_provedor)
  { code: 'purchases:create', description: 'Permite registrar compras a proveedores en el ERP' },
  { code: 'purchases:read', description: 'Permite visualizar el historial y detalle de compras' },
  { code: 'purchases:update', description: 'Permite modificar o actualizar compras en proceso' },
  { code: 'purchases:delete', description: 'Permite anular o eliminar registros de compras' },

  // Módulo de Inventario (Introducido por el módulo de Inventario)
  { code: 'inventory:read', description: 'Permite consultar inventarios y sus variantes' },

  // Módulo de Clientes (Customers Admin)
  { code: 'customers:read', description: 'Permite visualizar la lista y detalles de clientes de ecommerce' },
];
