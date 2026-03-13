# Mapeo de directorios `tenant/*` a tablas del DDL

Este documento relaciona los directorios funcionales solicitados con las tablas detectadas en `ddl_schema.sql`.

## Alcance y criterio

- Base usada: dump MySQL compartido (`dblatintest`).
- Criterio: nombre funcional del directorio + llaves foraneas + semantica de columnas.
- Nota: en algunos dominios no hay una tabla 1:1 con el mismo nombre del directorio, por lo que se incluyen tablas principales y de soporte.

---

## 1) `tenant/memberships/`

### Tablas principales

- `eva_company_user`
  - Pivot de pertenencia usuario-empresa (membership).
  - Campos clave: `company_id`, `user_id`, `role_id`, `status`, `company_edit`.
  - FK:
    - `company_id` -> `eva_companies.id`
    - `user_id` -> `eva_admin_users.id`

- `eva_admin_users`
  - Usuarios administrativos del tenant.
  - Campos clave: `company_id`, `role_id`, `user_type`, `status`.
  - FK:
    - `company_id` -> `eva_companies.id`
    - `role_id` -> `eva_admin_roles.id`

- `eva_admin_roles`
  - Roles por empresa.
  - FK:
    - `company_id` -> `eva_companies.id`

- `eva_admin_permissions`
  - Permisos por rol.
  - FK:
    - `role_id` -> `eva_admin_roles.id`

### Tablas relacionadas de contexto

- `eva_companies` (empresa/tenant dueño de la membresia).

### Flujo relacional recomendado

1. Empresa (`eva_companies`) define roles (`eva_admin_roles`).
2. Roles definen permisos (`eva_admin_permissions`).
3. Usuario admin (`eva_admin_users`) se asocia a empresa y/o rol.
4. Pivot de membresia y estado operativo en `eva_company_user`.

---

## 2) `tenant/candidates/`

### Tablas principales

- `eva_candidates`
  - Maestro de candidatos internos.
  - Campos clave: identidad, contacto, estado, metricas DISC/CI, `company_id`, `pais_id`.
  - FK:
    - `company_id` -> `eva_companies.id`
    - `pais_id` -> `eva_paises.id`

- `eva_external_candidates`
  - Candidatos manejados en flujo externo/proceso.
  - FK:
    - `id_candidate` -> `eva_candidates.id`
    - `id_user_create` -> `eva_admin_users.id`

- `eva_external_candidates_evaluations`
  - Evaluaciones asignadas al candidato externo.
  - Campos clave: `id_candidate`, `id_evaluation`, `link`, `generation_date`, `due_date`, `status`.
  - FK:
    - `id_candidate` -> `eva_external_candidates.id`
    - `id_evaluation` -> `eva_evaluaciones.id`

### Tablas de soporte del dominio

- `eva_historial_envio_wa`
  - Bitacora de envio WhatsApp para candidatos y procesos.
  - FK:
    - `candidate_id` -> `eva_candidates.id`
    - `external_candidate_id` -> `eva_external_candidates.id`
    - `proceso_id` -> `eva_procesos.id`

### Flujo relacional recomendado

1. Se registra candidato interno (`eva_candidates`).
2. Puede generarse su proyeccion externa (`eva_external_candidates`).
3. Se le asignan evaluaciones (`eva_external_candidates_evaluations`).
4. Se registran eventos de comunicacion (`eva_historial_envio_wa`).

---

## 3) `tenant/processes/`

### Tablas principales

- `eva_procesos`
  - Entidad central del proceso de reclutamiento/evaluacion.
  - Campos clave: `nombre`, `fecha_cierre`, `status`, `id_pais`, `group_id`, `id_user_create`, `id_user_asigned`.
  - FK:
    - `id_pais` -> `eva_paises.id`
    - `group_id` -> `eva_grupos_evaluaciones.id`

- `eva_external_candidates`
  - Campo de union operativa: `id_proceso`.
  - Nota: en el dump aparece indexado por negocio pero sin FK directa a `eva_procesos.id`.

### Tablas relacionadas

- `eva_grupos_evaluaciones` (agrupacion/logica de procesos por empresa).
- `eva_historial_envio_wa` (actividad del proceso sobre candidatos).

### Flujo relacional recomendado

1. Se crea proceso (`eva_procesos`) y opcionalmente se vincula a grupo.
2. Se agregan candidatos externos con `id_proceso`.
3. Se envian evaluaciones y se monitorean notificaciones/eventos.

---

## 4) `tenant/evaluations/`

### Tablas principales

- `eva_evaluaciones`
  - Catalogo base de evaluaciones.
  - Campos clave: `id_test`, `nombre`, `activo`, `id_evaluacion_tipo`, `id_evaluacion_factor`.

- `eva_company_evaluation`
  - Pivot empresa-evaluacion.
  - FK:
    - `company_id` -> `eva_companies.id`
    - `evaluation_id` -> `eva_evaluaciones.id`

- `eva_test_candidates`
  - Asignacion de test a candidato.
  - FK:
    - `test_id` -> `eva_evaluaciones.id`
    - `candidate_id` -> `eva_candidates.id`

- `eva_test_preguntas`
  - Mapeo test-preguntas.
  - FK:
    - `test_id` -> `eva_evaluaciones.id`
    - `pregunta_id` -> `eva_preguntas.pregunta_id`

- `eva_test_respuestas`
  - Respuestas de candidato por pregunta.
  - FK:
    - `testcandidate_id` -> `eva_test_candidates.testcandidate_id`
    - `pregunta_id` -> `eva_preguntas.pregunta_id`

- `eva_evaluation_result`
  - Resultado final por factor/evaluacion externa.
  - Campos clave: `evaluation_id`, `external_evaluation_id`, `evaluacion_factor_id`, `result_*`.

### Tablas de estructura y scoring de evaluacion

- `eva_evaluaciones_tipos`
- `eva_evaluaciones_factores`
- `eva_evaluaciones_factores_rangos`
- `eva_factores_rangos_personalizacion`
- `eva_rango_percentiles`
- `eva_percentiles_valores`
- `eva_percentiles_valores_detalle`
- `eva_ponderaciones_percentiles_company`
- `eva_percentil_respuestas`

### Flujo relacional recomendado

1. Definir evaluaciones, tipos y factores.
2. Asociar evaluaciones por empresa (`eva_company_evaluation`).
3. Asignar test a candidatos.
4. Capturar respuestas y calcular resultados.
5. Aplicar percentiles/rangos y personalizacion por empresa cuando aplique.

---

## 5) `tenant/assessment-content/`

### Tablas principales

- `eva_preguntas`
  - Banco de preguntas de evaluacion.

- `eva_opciones`
  - Banco de opciones de respuesta.

- `eva_pregunta_opciones`
  - Relacion N:M entre preguntas y opciones.
  - FK:
    - `pregunta_id` -> `eva_preguntas.pregunta_id`
    - `opcion_id` -> `eva_opciones.opcion_id`

- `eva_tipo_preguntas`
  - Tipologia de preguntas.

### Tablas relacionadas por scoring de contenido

- `eva_percentil_respuestas` (ponderacion por pregunta/opcion/percentil).

### Flujo relacional recomendado

1. Definir tipo de pregunta.
2. Crear pregunta.
3. Crear opciones y relacionarlas.
4. Configurar ponderaciones para motor de resultados.

---

## 6) `tenant/templates/`

### Tablas principales

- `eva_email_template`
  - Plantillas de correo por empresa.
  - Campos clave: `subject`, `template`, `company_id`, `type_id`, `status`.
  - FK:
    - `company_id` -> `eva_companies.id`
    - `type_id` -> `eva_email_type.id`

- `eva_email_type`
  - Tipos de plantilla de email.

- `eva_bot_plantilla`
  - Plantillas para bot (mensajeria/automatizacion).
  - FK:
    - `bot_id` -> `eva_config_bot.id`

### Tablas de soporte

- `eva_config_bot` (configuracion del bot donde viven plantillas bot).

### Flujo relacional recomendado

1. Definir tipos de email.
2. Crear plantillas por tenant.
3. Gestionar plantillas bot por configuracion de bot.

---

## 7) `tenant/integrations/`

### Tablas principales

- `eva_config_bot`
  - Integracion con bot/redes.
  - Campos clave: `idBotRedes`, `urlbot`, `api_token`, `ips`, `status`.

- `eva_bot_plantilla`
  - Artefacto vinculado a integracion bot (mensajes/plantillas).

- `eva_company_settings`
  - Configuracion por empresa orientada a integraciones y features.

- `eva_settings`
  - Configuracion global del sistema.

### Tablas relacionadas

- `eva_historial_envio_wa` (evidencia operativa de integracion de mensajeria).

### Flujo relacional recomendado

1. Registrar credenciales/configuraciones de bot.
2. Parametrizar settings company/global.
3. Operar plantillas y rastrear eventos de envio.

---

## 8) `tenant/catalogs/`

### Tablas principales

- `eva_catalogos_generales`
  - Catalogo dinamico general (`tipo_catalogo`, `value`, `text`, `activo`).

- `eva_paises`
  - Catalogo de paises.

- `eva_departamentos`
  - Catalogo de departamentos/provincias.
  - FK: `id_pais` -> `eva_paises.id`

- `eva_municipios`
  - Catalogo de municipios.

- `eva_grupos`
  - Catalogo de grupos base.

- `eva_grupos_evaluaciones`
  - Catalogo/agrupacion de evaluaciones por empresa.
  - FK: `company_id` -> `eva_companies.id`

- `eva_informes`
  - Catalogo de informes disponibles.

### Tablas relacionadas

- `eva_tipo_preguntas`, `eva_email_type`, `eva_evaluaciones_tipos`, `eva_tipo_valores_dimension`.

---

## 9) `tenant/reports/`

### Tablas principales candidatas

- `eva_informes`
  - Definicion base de tipos de informe.

- `eva_evaluation_result`
  - Fuente principal de resultados para reporteria de evaluaciones.

- `eva_candidates`
  - Datos demograficos y campos derivados para reportes de talento.

- `eva_external_candidates_evaluations`
  - Estado, vencimiento y trazabilidad de evaluaciones enviadas.

- `eva_logs`
  - Auditoria de acciones (insert/update/delete) util para reportes operativos.

### Tablas de soporte para reportes analiticos

- `eva_rango_percentiles`
- `eva_percentiles_valores`
- `eva_percentiles_valores_detalle`
- `eva_ponderaciones_percentiles_company`
- `eva_factores_rangos_personalizacion`

### Flujo relacional recomendado

1. Tomar hechos de resultados y ejecucion de evaluaciones.
2. Enriquecer con maestro de candidatos, empresa, pais y proceso.
3. Aplicar capas de scoring/percentiles.
4. Exponer por tipo de informe (`eva_informes`) y/o por tenant.

---

## Mapa rapido: directorio -> tablas principales

- `tenant/memberships/`
  - `eva_company_user`, `eva_admin_users`, `eva_admin_roles`, `eva_admin_permissions`
- `tenant/candidates/`
  - `eva_candidates`, `eva_external_candidates`, `eva_external_candidates_evaluations`, `eva_historial_envio_wa`
- `tenant/processes/`
  - `eva_procesos`, `eva_external_candidates`, `eva_grupos_evaluaciones`
- `tenant/evaluations/`
  - `eva_evaluaciones`, `eva_company_evaluation`, `eva_test_candidates`, `eva_test_preguntas`, `eva_test_respuestas`, `eva_evaluation_result`
- `tenant/assessment-content/`
  - `eva_preguntas`, `eva_opciones`, `eva_pregunta_opciones`, `eva_tipo_preguntas`, `eva_percentil_respuestas`
- `tenant/templates/`
  - `eva_email_template`, `eva_email_type`, `eva_bot_plantilla`, `eva_config_bot`
- `tenant/integrations/`
  - `eva_config_bot`, `eva_bot_plantilla`, `eva_company_settings`, `eva_settings`, `eva_historial_envio_wa`
- `tenant/catalogs/`
  - `eva_catalogos_generales`, `eva_paises`, `eva_departamentos`, `eva_municipios`, `eva_grupos`, `eva_grupos_evaluaciones`, `eva_informes`
- `tenant/reports/`
  - `eva_informes`, `eva_evaluation_result`, `eva_external_candidates_evaluations`, `eva_candidates`, `eva_logs`

---

## Observaciones tecnicas importantes

- Hay entidades que por negocio parecen relacionadas sin FK estricta declarada en el dump (por ejemplo `eva_external_candidates.id_proceso` con `eva_procesos.id`).
- Existen columnas legacy o nombres mixtos (`idEmpresa`, `idBotRedes`, etc.) que sugieren evolucion historica del esquema.
- Para construir repositorios/servicios por dominio conviene definir una matriz oficial de ownership de tablas para evitar cruces entre modulos.
