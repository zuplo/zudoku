/**
 * Spanish (Español) translation for Cosmo Cargo
 *
 * This demonstrates how to provide a full locale override for Zudoku.
 * Users can override all keys or just a subset — any missing keys
 * fall back to the built-in English defaults.
 */
export const es = {
  // Common
  "common.copy": "Copiar",
  "common.copyCode": "Copiar código",
  "common.copyToClipboard": "Copiar al portapapeles",
  "common.cancel": "Cancelar",
  "common.delete": "Eliminar",
  "common.error": "Error",
  "common.send": "Enviar",
  "common.name": "Nombre",
  "common.value": "Valor",

  // Code blocks
  "code.copy": "Copiar",
  "code.copyCode": "Copiar código",
  "code.defaultTitle": "Código",
  "code.clickToExpand": "Haz clic para expandir",
  "code.collapse": "Contraer",

  // OpenAPI Playground
  "openapi.playground.send": "Enviar",
  "openapi.playground.cancel": "Cancelar",
  "openapi.playground.authentication": "Autenticación",
  "openapi.playground.pathParameters": "Parámetros de ruta",
  "openapi.playground.queryParameters": "Parámetros de consulta",
  "openapi.playground.headers": "Encabezados",
  "openapi.playground.body": "Cuerpo",
  "openapi.playground.sendHint": "para enviar una solicitud",
  "openapi.playground.requestFailedNetwork":
    "La solicitud falló, posiblemente debido a problemas de red o política CORS.",

  "openapi.playground.field.name": "Nombre",
  "openapi.playground.field.value": "Valor",
  "openapi.playground.field.key": "Clave",
  "openapi.playground.field.requiredField": "Campo obligatorio",
  "openapi.playground.field.queryParamValue": "Valor del parámetro de consulta",
  "openapi.playground.header.lockedByAuth":
    "Este encabezado está configurado por la autenticación seleccionada.",
  "openapi.playground.header.overwrittenByAuth":
    "Este encabezado será sobrescrito por la autenticación seleccionada.",

  "openapi.playground.body.text": "Texto",
  "openapi.playground.body.file": "Archivo",
  "openapi.playground.body.multipart": "Multipart",
  "openapi.playground.body.placeholder": "Contenido del cuerpo",
  "openapi.playground.body.fileDropZone": "Zona para soltar archivos",
  "openapi.playground.body.selectOrDropFile":
    "Selecciona o arrastra un archivo",
  "openapi.playground.body.attachFile": "Adjuntar archivo",

  "openapi.playground.result.requestFailed": "Solicitud fallida",
  "openapi.playground.result.sendFirstRequest": "Envía tu primera solicitud",
  "openapi.playground.result.longRunning":
    "Parece que la solicitud está tardando más de lo esperado.",
  "openapi.playground.result.sendingRequest": "Enviando solicitud...",

  "openapi.playground.response.requestHeaders": "Encabezados de la solicitud",
  "openapi.playground.response.responseHeaders": "Encabezados de la respuesta",
  "openapi.playground.response.responseBody": "Cuerpo de la respuesta",
  "openapi.playground.response.view": "Vista",
  "openapi.playground.response.formatted": "Formateado",
  "openapi.playground.response.raw": "Sin formato",
  "openapi.playground.response.types": "Tipos",
  "openapi.playground.response.binaryContent": "Contenido binario",
  "openapi.playground.response.binaryDescription":
    "Esta respuesta contiene datos binarios que no se pueden mostrar como texto.",
  "openapi.playground.response.download": "Descargar {fileName} ({fileSize})",
  "openapi.playground.response.showMoreHeaders":
    "Mostrar {count} encabezados más",
  "openapi.playground.response.hideHeaders": "Ocultar {count} encabezados",
  "openapi.playground.response.size": "Tamaño",
  "openapi.playground.response.time": "Tiempo",

  "openapi.playground.login.title": "¡Bienvenido al Playground!",
  "openapi.playground.login.description":
    "El Playground es una herramienta para que los desarrolladores prueben y exploren nuestras APIs. Para usar el Playground, necesitas iniciar sesión.",
  "openapi.playground.login.dontShowAgain": "No mostrar de nuevo",
  "openapi.playground.login.skip": "Omitir",
  "openapi.playground.login.signUp": "Registrarse",
  "openapi.playground.login.login": "Iniciar sesión",

  "openapi.playground.identity.selectTitle":
    "Selecciona una identidad de autenticación",
  "openapi.playground.identity.selectDescription":
    "Por favor selecciona una identidad para esta solicitud.",
  "openapi.playground.identity.rememberChoice": "Recordar mi elección",
  "openapi.playground.identity.none": "Ninguna",

  "openapi.playground.examples.useExample": "Usar ejemplo",

  // Schema
  "openapi.schema.required": "obligatorio",
  "openapi.schema.deprecated": "obsoleto",
  "openapi.schema.circular": "circular",
  "openapi.schema.noDataReturned": "No se devolvieron datos",
  "openapi.schema.additionalProperties": "Se permiten propiedades adicionales",
  "openapi.schema.hideDeprecatedFields": "Ocultar campos obsoletos",
  "openapi.schema.showDeprecatedFields": "Mostrar {count} campo{s} obsoleto{s}",
  "openapi.schema.toggleProperties": "Alternar propiedades",
  "openapi.schema.example": "Ejemplo: ",
  "openapi.schema.default": "Predeterminado: ",
  "openapi.schema.enumValues": "Valores del enum:",
  "openapi.schema.showMore": "mostrar {count} más",
  "openapi.schema.showLess": "mostrar menos",

  // Parameters
  "openapi.parameters.headers": "Encabezados",
  "openapi.parameters.groupParameters": "Parámetros de {group}",
  "openapi.parameters.toggleParameter": "Alternar parámetro",

  // Download
  "openapi.download.schema": "Descargar esquema",
  "openapi.download.openInNewTab": "Abrir en nueva pestaña",

  // Version
  "openapi.version.select": "Seleccionar versión",

  // Sidecars
  "openapi.sidecar.exampleRequestBody": "Ejemplo de cuerpo de solicitud",
  "openapi.sidecar.exampleResponses": "Ejemplos de respuestas",
  "openapi.sidecar.toggleRequestBodyExamples":
    "Alternar ejemplos del cuerpo de solicitud",
  "openapi.sidecar.toggleResponseExamples": "Alternar ejemplos de respuestas",
  "openapi.sidecar.autoGenerated":
    "Este ejemplo se genera automáticamente a partir del esquema.",

  // Search
  "search.placeholder": "Buscar...",
  "search.noResults": "No se encontraron resultados.",
  "search.clearSearch": "Limpiar búsqueda",
  "search.startTyping": "Comienza a escribir para buscar",
  "search.errorLoading": "Ocurrió un error al cargar la búsqueda.",
  "search.navigate": "Navegar",
  "search.select": "Seleccionar",
  "search.closeDialog": "Cerrar diálogo",
  "search.buildIndex": "Construir índice de búsqueda",

  // API Keys
  "apiKeys.title": "Claves de API",
  "apiKeys.description": "Crea, gestiona y monitorea tus claves de API",
  "apiKeys.createKey": "Crear clave de API",
  "apiKeys.generateKey": "Generar clave",
  "apiKeys.name": "Nombre",
  "apiKeys.expiration": "Expiración",
  "apiKeys.days": "{count} días",
  "apiKeys.never": "Nunca",
  "apiKeys.defaultName": "Clave secreta",
  "apiKeys.emptyState": "Aún no tienes claves de API.",
  "apiKeys.emptyStateHint": "Comienza creando tu primera clave.",
  "apiKeys.editLabel": "Editar etiqueta",
  "apiKeys.rollKey": "Rotar clave",
  "apiKeys.rollKeyTooltip": "Rotar esta clave",
  "apiKeys.rollDialog.title": "Rotar clave de API",
  "apiKeys.rollDialog.description":
    "¿Estás seguro de que quieres rotar esta clave de API?",
  "apiKeys.rollDialog.confirm": "Rotar clave",
  "apiKeys.deleteDialog.title": "Eliminar clave de API",
  "apiKeys.deleteDialog.description":
    "¿Estás seguro de que quieres eliminar esta clave de API?",
  "apiKeys.created": "Creada {timeAgo}.",
  "apiKeys.expiresIn": "Expira en {count} {dayLabel}.",
  "apiKeys.expiredToday": "Expiró hoy.",
  "apiKeys.expiredDaysAgo": "Expiró hace {count} días.",
  "apiKeys.emailVerification.required":
    "Se requiere correo electrónico verificado",
  "apiKeys.emailVerification.message":
    "Necesitas verificar tu correo electrónico para acceder a las claves de API.",
  "apiKeys.refresh": "Actualizar",
  "apiKeys.requestVerification": "Solicitar verificación",

  // Status pages
  "status.400.title": "Solicitud incorrecta",
  "status.400.message":
    "El servidor no pudo entender la solicitud debido a una sintaxis mal formada.",
  "status.403.title": "Prohibido",
  "status.403.message": "No tienes permiso para acceder a este recurso.",
  "status.404.title": "No encontrado",
  "status.404.message": "El recurso solicitado no se pudo encontrar.",
  "status.500.title": "Error interno del servidor",
  "status.500.message": "Ocurrió un error inesperado al procesar tu solicitud.",
  "status.default.title": "Ocurrió un error",
  "status.default.message": "Algo salió mal al procesar tu solicitud.",

  // Not Found
  "notFound.title": "Página no encontrada",
  "notFound.description":
    "Parece que la página que buscas no existe o puede haber sido movida. Verifica la URL o usa el menú de navegación para encontrar la página correcta.",
  "notFound.goHome": "Volver al inicio",

  // Docs
  "docs.editThisPage": "Editar esta página",
  "docs.copyPage": "Copiar página",
  "docs.copyLinkToPage": "Copiar enlace a la página",
  "docs.openMarkdownPage": "Abrir página Markdown",
  "docs.pageActions": "Acciones de página",
  "docs.lastModifiedOn": "Última modificación el ",
  "docs.draft": "Esta página es un borrador y no es visible en producción.",

  // MCP
  "mcp.endpointTitle": "Endpoint MCP",
  "mcp.endpointDescription":
    "Copia la URL para conectar cualquier herramienta de IA compatible con MCP",
  "mcp.configurationTitle": "Configuración de herramienta de IA",
  "mcp.configurationDescription":
    "Elige tu herramienta de IA y copia la configuración para comenzar.",
  "mcp.viewOfficialDocs": "Ver documentación oficial",
} as const;
