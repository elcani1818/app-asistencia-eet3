# Análisis Detallado del Formulario Físico "Parte General de Alumnos" y Estructura Institucional

**Institución:** Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced"  
**Ubicación:** Loma Hermosa, Partido de Tres de Febrero, Provincia de Buenos Aires  
**Fecha de Análisis:** 2026-08-20  
**Archivos de Referencia Analizados:**
- `ORIGINAL_REQUEST.md`
- `PARTE GENERALES TV.xlsx - T.V.csv`
- `PARTE GENERALES TV.xlsx - T.V.pdf`
- `extract.ps1`

---

## 1. Listado Completo de Cursos - Turno Vespertino (Datos Semilla del CSV)

A partir de la planilla oficial del Turno Vespertino (`PARTE GENERALES TV.xlsx - T.V.csv` y PDF correspondiente), se extrae la matrícula inicial e identificación exacta de los 10 cursos que componen este turno:

| Año / Curso | División | Orientación | Nombre Completo Especialidad | Inscriptos Varones (V) | Inscriptas Mujeres (M) | Inscriptos Total (T) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **5º** | **4º** | `TECET` | Técnico Electromecánico | 8 | 0 (`-`) | 8 |
| **6º** | **1º** | `TECQU` | Técnico Químico | 11 | 4 | 15 |
| **6º** | **2º** | `TECMM` | Técnico Maestro Mayor de Obra | 9 | 14 | 23 |
| **6º** | **3º** | `TECET` | Técnico Electromecánico | 23 | 2 | 25 |
| **6º** | **4º** | `TECET` | Técnico Electromecánico | 6 | 0 (`-`) | 6 |
| **7º** | **1º** | `TECQU` | Técnico Químico | 5 | 8 | 13 |
| **7º** | **2º** | `TECMM` | Técnico Maestro Mayor de Obra | 9 | 9 | 18 |
| **7º** | **3º** | `TECET` | Técnico Electromecánico | 20 | 9 | 29 |
| **7º** | **4º** | `TECET` | Técnico Electromecánico | 8 | 0 (`-`) | 8 |
| **1°** | **1°** | `C.TEC.MMO` | Ciclo Técnico en Maestro Mayor de Obras (Especial) | 20 | 7 | 27 |
| **TOTAL** | — | — | **Totales Turno Vespertino** | **119** | **53** | **172** |

### Observaciones sobre los datos del Turno Vespertino:
1. En el CSV original, las celdas sin alumnas mujeres figuran con un guion (`-`), lo que equivale a `0`.
2. El total verificado coincide exactamente: $119 \text{ (Varones)} + 53 \text{ (Mujeres)} = 172 \text{ (Total Inscriptos)}$.
3. El curso `1° 1° C.TEC.MMO` es un curso específico del turno vespertino para formación técnica acelerada/nocturna de Maestro Mayor de Obras, diferenciado del `1° 1°` del Ciclo Básico general.

---

## 2. Estructura Escolar Completa de los 3 Turnos

La E.E.S.T. N° 3 organiza sus actividades en **tres turnos**: **Turno Mañana (TM)**, **Turno Tarde (TT)** y **Turno Vespertino (TV)**.

### A. Ciclo Básico (1° a 3° Año)
Formación técnica general común (sin orientación de especialidad). Generalmente distribuido entre los turnos Mañana y Tarde:
- **1° Año:** `1°1ª`, `1°2ª`, `1°3ª`, `1°4ª`, `1°5ª`
- **2° Año:** `2°1ª`, `2°2ª`, `2°3ª`, `2°4ª`, `2°5ª`
- **3° Año:** `3°1ª`, `3°2ª`, `3°3ª`, `3°4ª`
*(Total: 14 cursos base de Ciclo Básico)*

### B. Ciclo Superior (4° a 7° Año)
Formación técnica especializada según la división:
- **División 1ª (`TECQU` - Técnico Químico):**
  - `4°1ª TECQU`, `5°1ª TECQU`, `6°1ª TECQU`, `7°1ª TECQU`
- **División 2ª (`TECMM` - Técnico Maestro Mayor de Obra):**
  - `4°2ª TECMM`, `5°2ª TECMM`, `6°2ª TECMM`, `7°2ª TECMM`
- **División 3ª (`TECET` - Técnico Electromecánico):**
  - `4°3ª TECET`, `5°3ª TECET`, `6°3ª TECET`, `7°3ª TECET`
- **División 4ª (`TECET` - Técnico Electromecánico):**
  - `4°4ª TECET` *(si se habilita)*, `5°4ª TECET`, `6°4ª TECET`, `7°4ª TECET`
*(Total: 15-16 cursos de Ciclo Superior)*

### C. Ciclo Técnico Especial
- `1°1ª C.TEC.MMO` (Ciclo Técnico en Maestro Mayor de Obras) — curso nocturno/vespertino para adultos o trayecto técnico especial.

### D. Dinámica de Asignación por Turno en la Aplicación
- La base de datos debe almacenar el catálogo maestro de cursos y permitir al **Administrador** configurar a qué turno pertenece cada curso, qué preceptor/profesor tiene asignado y la matrícula inicial de inscriptos ($I_V, I_M, I_T$).
- El Turno Vespertino se inicializa con los datos del CSV. Los turnos Mañana y Tarde serán poblados por el administrador con los cursos correspondientes del Ciclo Básico y Ciclo Superior.

---

## 3. Fórmulas Matemáticas de Cálculo y Validaciones de Integridad

El sistema debe automatizar todos los cálculos y aplicar validaciones estrictas en el formulario de carga y en el reporte general.

### A. Fórmulas a Nivel de Curso (Fila)
1. **Total Inscriptos ($I_T$):**
   $$I_T = I_V + I_M$$
   *(Pre-cargado desde la configuración del curso, editable por el Administrador).*

2. **Total Presentes ($P_T$):**
   $$P_T = P_V + P_M$$
   *(Calculado en tiempo real a medida que el profesor o preceptor ingresa $P_V$ y $P_M$).*

3. **Total Ausentes ($A_T$):**
   $$A_T = A_V + A_M$$
   *(Calculado en tiempo real a medida que se ingresa $A_V$ y $A_M$).*

4. **Porcentaje de Asistencia por Curso ($\%A_c$):**
   $$\%A_c = \begin{cases} \left(\dfrac{P_T}{I_T}\right) \times 100 & \text{si } I_T > 0 \\ 0\% & \text{si } I_T = 0 \end{cases}$$

5. **Porcentaje de Ausentismo por Curso ($\%Aus_c$):**
   $$\%Aus_c = 100\% - \%A_c = \left(\dfrac{A_T}{I_T}\right) \times 100$$

### B. Reglas de Validación de Integridad (Hard Validation en Formulario)
Para que un parte de asistencia sea válido y se pueda guardar, deben cumplirse simultáneamente las siguientes condiciones por cada género:
1. **Validación de Varones:**
   $$P_V + A_V = I_V$$
2. **Validación de Mujeres:**
   $$P_M + A_M = I_M$$
3. **Validación de Rango:**
   $$0 \le P_V \le I_V \quad \land \quad 0 \le A_V \le I_V$$
   $$0 \le P_M \le I_M \quad \land \quad 0 \le A_M \le I_M$$
   *(Valores enteros no negativos).*
4. **Consecuencia Lógica:**
   $$P_T + A_T = I_T$$

*Nota de UX:* Si el usuario ingresa $P_V$, la interfaz puede auto-sugerir o autocalcular $A_V = I_V - P_V$ (y análogamente para $M$), o bien validar en vivo indicando con badge verde/rojo si la suma coincide con la matrícula oficial.

### C. Fórmulas a Nivel de Turno (Totales del Parte General)
Para un turno $T$ con conjunto de cursos $C$:
1. **Matrícula Total del Turno:**
   $$\text{Total } I_V = \sum_{c \in C} I_{V,c}, \quad \text{Total } I_M = \sum_{c \in C} I_{M,c}, \quad \text{Total } I_T = \sum_{c \in C} I_{T,c}$$
2. **Presentismo Total del Turno:**
   $$\text{Total } P_V = \sum_{c \in C} P_{V,c}, \quad \text{Total } P_M = \sum_{c \in C} P_{M,c}, \quad \text{Total } P_T = \sum_{c \in C} P_{T,c}$$
3. **Ausentismo Total del Turno:**
   $$\text{Total } A_V = \sum_{c \in C} A_{V,c}, \quad \text{Total } A_M = \sum_{c \in C} A_{M,c}, \quad \text{Total } A_T = \sum_{c \in C} A_{T,c}$$
4. **Porcentaje de Asistencia General del Turno ($\%A_{\text{Turno}}$):**
   $$\%A_{\text{Turno}} = \left(\dfrac{\text{Total } P_T}{\text{Total } I_T}\right) \times 100$$

---

## 4. Estructura y Distribución Visual del Formulario ("Parte General")

El diseño de la aplicación web y los módulos de exportación (PDF / Excel) deben replicar con exactitud la disposición del documento físico oficial:

```
+-----------------------------------------------------------------------------------------------+
|                       ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3                            |
|                               "Ntra. Sra. de la Merced"                                       |
|                                     PARTE GENERAL                                             |
|                                        ALUMNOS                                                |
|                                                                                               |
| LOMA HERMOSA, [  ] de [                  ] de 20[  ]                  TURNO: [             ]  |
+-------------------+---------------+-------------------+-------------------+-------------------+
| CURSOS            | ORIENTACIÓN   |    INSCRIPTOS     |     PRESENTES     |      AUSENTES     |
|                   |               |   V |  M  |   T   |   V |  M  |   T   |   V |  M  |   T   |
+-------------------+---------------+-----+-----+-------+-----+-----+-------+-----+-----+-------+
| 5º4º              | TECET         |   8 |   - |     8 |     |     |       |     |     |       |
| 6º1º              | TECQU         |  11 |   4 |    15 |     |     |       |     |     |       |
| 6º2º              | TECMM         |   9 |  14 |    23 |     |     |       |     |     |       |
| 6º3º              | TECET         |  23 |   2 |    25 |     |     |       |     |     |       |
| 6º4º              | TECET         |   6 |   - |     6 |     |     |       |     |     |       |
| 7º1º              | TECQU         |   5 |   8 |    13 |     |     |       |     |     |       |
| 7º2º              | TECMM         |   9 |   9 |    18 |     |     |       |     |     |       |
| 7º3º              | TECET         |  20 |   9 |    29 |     |     |       |     |     |       |
| 7º4º              | TECET         |   8 |   - |     8 |     |     |       |     |     |       |
| 1° 1°             | C.TEC.MMO     |  20 |   7 |    27 |     |     |       |     |     |       |
+-------------------+---------------+-----+-----+-------+-----+-----+-------+-----+-----+-------+
| TOTAL             |               | 119 |  53 |   172 |     |     |       |     |     |       |
+-------------------+---------------+-----+-----+-------+-----+-----+-------+-----+-----+-------+
| OBSERVACIONES:                                                                                |
| _____________________________________________________________________________________________ |
+-----------------------------------------------------------------------------------------------+
| AUSENTE DE DOCENTES Y AUXILIARES:                                                             |
| _____________________________________________________________________________________________ |
+-----------------------------------------------------------------------------------------------+
```

### Componentes Específicos del Layout:

1. **Encabezado Institucional:**
   - Nombre de la escuela: `ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"`
   - Título del reporte: `PARTE GENERAL - ALUMNOS`
   - Metadatos de fecha y lugar: `LOMA HERMOSA, [día] de [mes] de 20[año]`
   - Selector / Indicador de Turno: `Mañana` / `Tarde` / `Vespertino`
   - Preceptor / Responsable a cargo.

2. **Tabla Principal de Datos (11 Columnas):**
   - **Columna 1:** `CURSOS` (Año y División, ej. 5º4º, 6º1º)
   - **Columna 2:** `ORIENTACIÓN` (`TECQU`, `TECMM`, `TECET`, `C.TEC.MMO` o vacío)
   - **Columnas 3, 4, 5 (`INSCRIPTOS`):** `V` (Varones), `M` (Mujeres), `T` (Total)
   - **Columnas 6, 7, 8 (`PRESENTES`):** `V` (Varones), `M` (Mujeres), `T` (Total)
   - **Columnas 9, 10, 11 (`AUSENTES`):** `V` (Varones), `M` (Mujeres), `T` (Total)

3. **Fila de Totales (`TOTAL`):**
   - Resumen inferior con la sumatoria de cada una de las 9 columnas numéricas ($I_V, I_M, I_T, P_V, P_M, P_T, A_V, A_M, A_T$).

4. **Sección de Observaciones (`OBSERVACIONES`):**
   - Campo de texto libre para asentar novedades del turno (retiros tempranos, suspensión de actividades por clima o corte de servicio, eventos pedagógicos, talleres fuera de sede, etc.).

5. **Sección de Ausencias de Personal (`AUSENTE DE DOCENTES Y AUXILIARES`):**
   - Registro de personal ausente en el turno:
     - Nombre del Docente / Auxiliar
     - Cargo / Asignatura / Curso
     - Motivo / Artículo / Observación (opcional)

6. **Impresión / Exportación:**
   - La hoja física tradicional imprime dos partes por página (formato apaisado / 2-up). La exportación PDF/Excel debe ofrecer una vista limpia y fiel que permita tanto la impresión física oficial como el archivo digital.

---

## 5. Resumen de Requisitos para el Modelo de Datos (Supabase)

Para soportar fielmente esta estructura, el esquema relacional requiere:
- **`shifts` (Turnos):** `id`, `name` ('Mañana', 'Tarde', 'Vespertino'), `code` ('TM', 'TT', 'TV'), `order_num`.
- **`courses` (Cursos):** `id`, `year` (1 a 7), `division` (1 a 5), `cycle` ('BÁSICO', 'SUPERIOR', 'TÉCNICO ESPECIAL'), `orientation` ('TECQU', 'TECMM', 'TECET', 'C.TEC.MMO', null), `shift_id`, `enrolled_male`, `enrolled_female`, `enrolled_total`, `active`.
- **`attendance_records` (Partes Diarios por Curso):** `id`, `date`, `course_id`, `shift_id`, `submitted_by` (user_id), `present_male`, `present_female`, `present_total`, `absent_male`, `absent_female`, `absent_total`, `attendance_rate`, `notes` (observaciones del curso), `created_at`, `updated_at`.
- **`shift_reports` (Reporte General del Turno):** `id`, `date`, `shift_id`, `general_notes` (observaciones generales), `created_by`, `status` ('draft', 'submitted', 'locked').
- **`staff_absences` (Ausencias Docentes/Auxiliares):** `id`, `shift_report_id` o `(date, shift_id)`, `staff_name`, `role_type` ('DOCENTE', 'AUXILIAR'), `subject_or_duty`, `course_id` (opcional), `reason`.
