import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Course, Shift, Orientation } from '../lib/types';
import { Users, BookOpen, Layers, Plus, Trash2, Pencil, X, Check, Sparkles } from 'lucide-react';

interface ExtendedCourse extends Course {
  shifts?: Shift;
  orientations?: Orientation;
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'courses'>('users');
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [orientations, setOrientations] = useState<Orientation[]>([]);
  const [preceptors, setPreceptors] = useState<Profile[]>([]);
  
  const [selectedProf, setSelectedProf] = useState<string>('');
  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // ---- USER STATE ----
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ full_name: '', role: '' });

  // ---- COURSE STATE ----
  const [courseShiftFilter, setCourseShiftFilter] = useState<string>('all');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [seedingBasico, setSeedingBasico] = useState(false);

  const initialCourseForm = {
    year: 1,
    division: 1,
    display_name: '1° 1ª',
    shift_id: '',
    orientation_id: '',
    inscriptos_v: 0,
    inscriptos_m: 0,
    cycle: 'basico' as 'basico' | 'superior' | 'tecnico',
    is_active: true
  };
  const [courseForm, setCourseForm] = useState(initialCourseForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Profiles
      const { data: pData } = await supabase.from('profiles').select('*').order('full_name');
      if (pData) {
        setProfiles(pData as Profile[]);
        setPreceptors(pData.filter(p => p.role === 'preceptor' || p.role === 'admin'));
      }

      // 2. Shifts
      const { data: sData } = await supabase.from('shifts').select('*').order('display_order');
      if (sData) {
        setShifts(sData as Shift[]);
      }

      // 3. Orientations
      const { data: oData } = await supabase.from('orientations').select('*').order('code');
      if (oData) {
        setOrientations(oData as Orientation[]);
      }

      // 4. Courses
      const { data: cData } = await supabase
        .from('courses')
        .select(`*, shifts(id, name, display_order), orientations(id, code, full_name)`)
        .order('year')
        .order('division');
      if (cData) setCourses(cData as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Suggest orientation & cycle based on year and division
  const getSmartCourseDefaults = (year: number, division: number, currentOrientations: Orientation[]) => {
    const cb = currentOrientations.find(o => o.code === 'CB');
    const tecqu = currentOrientations.find(o => o.code === 'TECQU');
    const tecmm = currentOrientations.find(o => o.code === 'TECMM');
    const tecet = currentOrientations.find(o => o.code === 'TECET');

    let suggestedOrientationId = cb?.id || '';
    let suggestedCycle: 'basico' | 'superior' | 'tecnico' = 'basico';
    let suggestedName = `${year}° ${division}ª`;

    if (year <= 3) {
      suggestedCycle = 'basico';
      suggestedOrientationId = cb?.id || '';
    } else {
      suggestedCycle = 'superior';
      if (division === 1) {
        suggestedOrientationId = tecqu?.id || '';
      } else if (division === 2) {
        suggestedOrientationId = tecmm?.id || '';
      } else if (division === 3 || division === 4) {
        suggestedOrientationId = tecet?.id || '';
      }
    }

    return {
      suggestedOrientationId,
      suggestedCycle,
      suggestedName
    };
  };

  // ==================== USER HANDLERS ====================
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      showMessage('Complete todos los campos', 'error');
      return;
    }
    if (newUser.password.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.rpc('admin_create_user', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_full_name: newUser.full_name,
        p_role: 'preceptor'
      });
      if (error) throw error;
      showMessage(`Usuario "${newUser.full_name}" creado como Preceptor`, 'success');
      setNewUser({ email: '', password: '', full_name: '' });
      setShowCreateForm(false);
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al crear usuario', 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditData({ full_name: p.full_name, role: p.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ full_name: '', role: '' });
  };

  const saveEdit = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles')
        .update({ full_name: editData.full_name, role: editData.role })
        .eq('id', userId);
      if (error) throw error;
      
      showMessage('Usuario actualizado', 'success');
      setEditingId(null);
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al actualizar', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
      if (error) throw error;
      showMessage(`Usuario "${name}" eliminado`, 'success');
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al eliminar', 'error');
    }
  };

  // ==================== ASSIGNMENT HANDLERS ====================
  const loadAssignments = async (profId: string) => {
    setSelectedProf(profId);
    if (!profId) {
      setAssignedCourses([]);
      return;
    }
    try {
      const { data } = await supabase.from('professor_courses').select('course_id').eq('professor_id', profId);
      if (data) setAssignedCourses(data.map(d => d.course_id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAssignment = (courseId: string) => {
    setAssignedCourses(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const saveAssignments = async () => {
    if (!selectedProf) return;
    try {
      await supabase.from('professor_courses').delete().eq('professor_id', selectedProf);
      if (assignedCourses.length > 0) {
        const inserts = assignedCourses.map(cid => ({ professor_id: selectedProf, course_id: cid }));
        await supabase.from('professor_courses').insert(inserts);
      }
      showMessage('Asignaciones guardadas', 'success');
    } catch (e) {
      showMessage('Error al guardar', 'error');
    }
  };

  // ==================== COURSE HANDLERS ====================
  const openNewCourseModal = () => {
    const defaultShiftId = shifts[0]?.id || '';
    const defaults = getSmartCourseDefaults(1, 1, orientations);
    setCourseForm({
      year: 1,
      division: 1,
      display_name: defaults.suggestedName,
      shift_id: defaultShiftId,
      orientation_id: defaults.suggestedOrientationId,
      inscriptos_v: 0,
      inscriptos_m: 0,
      cycle: defaults.suggestedCycle,
      is_active: true
    });
    setEditingCourseId(null);
    setShowCourseModal(true);
  };

  const openEditCourseModal = (course: ExtendedCourse) => {
    setEditingCourseId(course.id);
    setCourseForm({
      year: course.year,
      division: course.division,
      display_name: course.display_name,
      shift_id: course.shift_id,
      orientation_id: course.orientation_id,
      inscriptos_v: course.inscriptos_v,
      inscriptos_m: course.inscriptos_m,
      cycle: course.cycle,
      is_active: course.is_active
    });
    setShowCourseModal(true);
  };

  const handleYearChange = (yearNum: number) => {
    const defaults = getSmartCourseDefaults(yearNum, courseForm.division, orientations);
    setCourseForm(prev => ({
      ...prev,
      year: yearNum,
      display_name: defaults.suggestedName,
      orientation_id: defaults.suggestedOrientationId,
      cycle: defaults.suggestedCycle
    }));
  };

  const handleDivisionChange = (divNum: number) => {
    const defaults = getSmartCourseDefaults(courseForm.year, divNum, orientations);
    setCourseForm(prev => ({
      ...prev,
      division: divNum,
      display_name: defaults.suggestedName,
      orientation_id: defaults.suggestedOrientationId,
      cycle: defaults.suggestedCycle
    }));
  };

  // Cursos oficiales Ciclo Básico Turno Mañana (según Parte General)
  const OFFICIAL_MANANA_COURSES = [
    { year: 1, division: 1, display_name: '1° 1°', inscriptos_v: 19, inscriptos_m: 6 },
    { year: 1, division: 2, display_name: '1° 2°', inscriptos_v: 14, inscriptos_m: 13 },
    { year: 1, division: 5, display_name: '1° 5°', inscriptos_v: 13, inscriptos_m: 11 },
    { year: 2, division: 1, display_name: '2° 1°', inscriptos_v: 17, inscriptos_m: 8 },
    { year: 2, division: 2, display_name: '2° 2°', inscriptos_v: 12, inscriptos_m: 13 },
    { year: 2, division: 3, display_name: '2° 3°', inscriptos_v: 17, inscriptos_m: 8 },
    { year: 2, division: 5, display_name: '2° 5°', inscriptos_v: 16, inscriptos_m: 6 },
    { year: 3, division: 2, display_name: '3° 2°', inscriptos_v: 10, inscriptos_m: 15 },
    { year: 3, division: 3, display_name: '3° 3°', inscriptos_v: 18, inscriptos_m: 6 },
    { year: 3, division: 4, display_name: '3° 4°', inscriptos_v: 12, inscriptos_m: 15 },
  ];

  const handleSeedTurnoMananaOficial = async () => {
    // 1. Identificar el Turno Mañana
    let mananaShift = shifts.find(s => s.name?.toLowerCase().includes('mañana'));
    if (!mananaShift && shifts.length > 0) {
      mananaShift = shifts[0];
    }

    if (!mananaShift) {
      showMessage('No se encontró el Turno Mañana en el sistema.', 'error');
      return;
    }

    // 2. Identificar la Orientación Ciclo Básico
    const cbOrientation = orientations.find(o => o.code === 'CB' || o.full_name?.toLowerCase().includes('básico'));

    if (!confirm(`¿Desea cargar los 10 cursos oficiales del Ciclo Básico en Turno ${mananaShift.name} con las matrículas de alumnos (19V+6M en 1°1°, 14V+13M en 1°2°, etc.)?`)) {
      return;
    }

    setSeedingBasico(true);
    try {
      let orientationId = cbOrientation?.id;
      if (!orientationId) {
        const { data: newOrient, error: oErr } = await supabase
          .from('orientations')
          .insert({ code: 'CB', full_name: 'Ciclo Básico' })
          .select('id')
          .single();
        if (!oErr && newOrient) {
          orientationId = newOrient.id;
        } else if (orientations.length > 0) {
          orientationId = orientations[0].id;
        }
      }

      let count = 0;
      for (const c of OFFICIAL_MANANA_COURSES) {
        const inscriptos_t = c.inscriptos_v + c.inscriptos_m;
        
        // Verificar si ya existe este curso para este turno
        const existing = courses.find(
          item => item.shift_id === mananaShift?.id && 
          (item.display_name === c.display_name || (item.year === c.year && item.division === c.division))
        );

        if (existing) {
          // Actualizar matrícula oficial
          const { error: updErr } = await supabase
            .from('courses')
            .update({
              display_name: c.display_name,
              orientation_id: orientationId || existing.orientation_id,
              inscriptos_v: c.inscriptos_v,
              inscriptos_m: c.inscriptos_m,
              inscriptos_t,
              cycle: 'basico',
              is_active: true
            })
            .eq('id', existing.id);
          if (!updErr) count++;
        } else {
          // Insertar nuevo curso
          const { error: insErr } = await supabase
            .from('courses')
            .insert({
              shift_id: mananaShift.id,
              year: c.year,
              division: c.division,
              display_name: c.display_name,
              orientation_id: orientationId,
              inscriptos_v: c.inscriptos_v,
              inscriptos_m: c.inscriptos_m,
              inscriptos_t,
              cycle: 'basico',
              is_active: true
            });
          if (!insErr) count++;
        }
      }

      showMessage(`Se cargaron/actualizaron exitosamente los ${count} cursos oficiales de Turno Mañana`, 'success');
      setCourseShiftFilter(mananaShift.id);
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al cargar cursos oficiales de Turno Mañana', 'error');
    } finally {
      setSeedingBasico(false);
    }
  };

  // Cursos oficiales Turno Tarde (según Parte General)
  const OFFICIAL_TARDE_COURSES = [
    { year: 1, division: 3, display_name: '1° 3°', inscriptos_v: 16, inscriptos_m: 11, orientation_code: 'CB', cycle: 'basico' as const },
    { year: 1, division: 4, display_name: '1° 4°', inscriptos_v: 18, inscriptos_m: 8, orientation_code: 'CB', cycle: 'basico' as const },
    { year: 2, division: 4, display_name: '2° 4°', inscriptos_v: 18, inscriptos_m: 11, orientation_code: 'CB', cycle: 'basico' as const },
    { year: 3, division: 1, display_name: '3° 1°', inscriptos_v: 17, inscriptos_m: 11, orientation_code: 'CB', cycle: 'basico' as const },
    { year: 4, division: 1, display_name: '4° 1°', inscriptos_v: 9, inscriptos_m: 20, orientation_code: 'TECQU', cycle: 'superior' as const },
    { year: 4, division: 2, display_name: '4° 2°', inscriptos_v: 17, inscriptos_m: 14, orientation_code: 'TECMM', cycle: 'superior' as const },
    { year: 4, division: 3, display_name: '4° 3°', inscriptos_v: 28, inscriptos_m: 7, orientation_code: 'TECET', cycle: 'superior' as const },
    { year: 5, division: 1, display_name: '5° 1°', inscriptos_v: 7, inscriptos_m: 18, orientation_code: 'TECQU', cycle: 'superior' as const },
    { year: 5, division: 2, display_name: '5° 2°', inscriptos_v: 10, inscriptos_m: 11, orientation_code: 'TECMM', cycle: 'superior' as const },
    { year: 5, division: 3, display_name: '5° 3°', inscriptos_v: 22, inscriptos_m: 10, orientation_code: 'TECET', cycle: 'superior' as const },
  ];

  const handleSeedTurnoTardeOficial = async () => {
    let tardeShift = shifts.find(s => s.name?.toLowerCase().includes('tarde'));
    if (!tardeShift && shifts.length > 1) {
      tardeShift = shifts[1];
    }

    if (!tardeShift) {
      showMessage('No se encontró el Turno Tarde en el sistema.', 'error');
      return;
    }

    if (!confirm(`¿Desea cargar los 10 cursos oficiales en Turno ${tardeShift.name} con las matrículas de alumnos (16V+11M en 1°3°, 9V+20M en 4°1°, etc.)?`)) {
      return;
    }

    setSeedingBasico(true);
    try {
      const getOrientationId = async (code: string, fallbackName: string) => {
        let found = orientations.find(o => o.code === code);
        if (!found) {
          const { data: created } = await supabase
            .from('orientations')
            .insert({ code, full_name: fallbackName })
            .select('id')
            .single();
          if (created) return created.id;
        }
        return found?.id || orientations[0]?.id;
      };

      const cbId = await getOrientationId('CB', 'Ciclo Básico');
      const tecquId = await getOrientationId('TECQU', 'Técnico en Química');
      const tecmmId = await getOrientationId('TECMM', 'Técnico en Electromecánica');
      const tecetId = await getOrientationId('TECET', 'Técnico en Electrónica');

      const orientationMap: Record<string, string> = {
        CB: cbId,
        TECQU: tecquId,
        TECMM: tecmmId,
        TECET: tecetId
      };

      let count = 0;
      for (const c of OFFICIAL_TARDE_COURSES) {
        const inscriptos_t = c.inscriptos_v + c.inscriptos_m;
        const orientationId = orientationMap[c.orientation_code] || cbId;

        const existing = courses.find(
          item => item.shift_id === tardeShift?.id && 
          (item.display_name === c.display_name || (item.year === c.year && item.division === c.division))
        );

        if (existing) {
          const { error: updErr } = await supabase
            .from('courses')
            .update({
              display_name: c.display_name,
              orientation_id: orientationId,
              inscriptos_v: c.inscriptos_v,
              inscriptos_m: c.inscriptos_m,
              inscriptos_t,
              cycle: c.cycle,
              is_active: true
            })
            .eq('id', existing.id);
          if (!updErr) count++;
        } else {
          const { error: insErr } = await supabase
            .from('courses')
            .insert({
              shift_id: tardeShift.id,
              year: c.year,
              division: c.division,
              display_name: c.display_name,
              orientation_id: orientationId,
              inscriptos_v: c.inscriptos_v,
              inscriptos_m: c.inscriptos_m,
              inscriptos_t,
              cycle: c.cycle,
              is_active: true
            });
          if (!insErr) count++;
        }
      }

      showMessage(`Se cargaron/actualizaron exitosamente los ${count} cursos oficiales de Turno Tarde`, 'success');
      setCourseShiftFilter(tardeShift.id);
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al cargar cursos oficiales de Turno Tarde', 'error');
    } finally {
      setSeedingBasico(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!courseForm.shift_id || !courseForm.orientation_id || !courseForm.display_name) {
      showMessage('Complete el turno, la orientación y el nombre del curso', 'error');
      return;
    }

    setSavingCourse(true);
    try {
      const inscriptos_v = Number(courseForm.inscriptos_v) || 0;
      const inscriptos_m = Number(courseForm.inscriptos_m) || 0;
      const inscriptos_t = inscriptos_v + inscriptos_m;

      if (editingCourseId) {
        // Intento 1: RPC
        const { error: rpcError } = await supabase.rpc('admin_update_course', {
          p_course_id: editingCourseId,
          p_year: courseForm.year,
          p_division: courseForm.division,
          p_display_name: courseForm.display_name,
          p_shift_id: courseForm.shift_id,
          p_orientation_id: courseForm.orientation_id,
          p_inscriptos_v: inscriptos_v,
          p_inscriptos_m: inscriptos_m,
          p_cycle: courseForm.cycle,
          p_is_active: courseForm.is_active
        });

        // Fallback a tabla directa si el RPC falla
        if (rpcError) {
          const { error: tblError } = await supabase
            .from('courses')
            .update({
              year: courseForm.year,
              division: courseForm.division,
              display_name: courseForm.display_name,
              shift_id: courseForm.shift_id,
              orientation_id: courseForm.orientation_id,
              inscriptos_v,
              inscriptos_m,
              inscriptos_t,
              cycle: courseForm.cycle,
              is_active: courseForm.is_active
            })
            .eq('id', editingCourseId);
          if (tblError) throw tblError;
        }

        showMessage('Curso actualizado correctamente', 'success');
      } else {
        // Intento 1: RPC
        const { error: rpcError } = await supabase.rpc('admin_create_course', {
          p_year: courseForm.year,
          p_division: courseForm.division,
          p_display_name: courseForm.display_name,
          p_shift_id: courseForm.shift_id,
          p_orientation_id: courseForm.orientation_id,
          p_inscriptos_v: inscriptos_v,
          p_inscriptos_m: inscriptos_m,
          p_cycle: courseForm.cycle
        });

        // Fallback a tabla directa si el RPC falla
        if (rpcError) {
          const { error: tblError } = await supabase
            .from('courses')
            .insert({
              year: courseForm.year,
              division: courseForm.division,
              display_name: courseForm.display_name,
              shift_id: courseForm.shift_id,
              orientation_id: courseForm.orientation_id,
              inscriptos_v,
              inscriptos_m,
              inscriptos_t,
              cycle: courseForm.cycle,
              is_active: true
            });
          if (tblError) throw tblError;
        }

        showMessage('Curso creado con éxito', 'success');
      }

      setShowCourseModal(false);
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al guardar curso', 'error');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, displayName: string) => {
    if (!confirm(`¿Está seguro de eliminar el curso "${displayName}"? Se borrarán sus asistencias y asignaciones vinculadas.`)) return;
    try {
      const { error: rpcError } = await supabase.rpc('admin_delete_course', { p_course_id: courseId });
      if (rpcError) {
        const { error: tblError } = await supabase.from('courses').delete().eq('id', courseId);
        if (tblError) throw tblError;
      }
      showMessage(`Curso "${displayName}" eliminado`, 'success');
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al eliminar curso', 'error');
    }
  };

  const handleSeedCicloBasico = async () => {
    const targetShiftId = courseShiftFilter !== 'all' ? courseShiftFilter : shifts[0]?.id;
    const targetShiftName = shifts.find(s => s.id === targetShiftId)?.name || 'seleccionado';
    
    if (!confirm(`¿Desea crear automáticamente los cursos del Ciclo Básico en el Turno ${targetShiftName}? Los que ya existan no se duplicarán.`)) {
      return;
    }

    setSeedingBasico(true);
    try {
      const { data, error } = await supabase.rpc('admin_seed_ciclo_basico', { p_shift_id: targetShiftId });
      if (error) {
        // Fallback: insertar los cursos estándar de ciclo básico
        const cbOrientation = orientations.find(o => o.code === 'CB');
        let count = 0;
        const basicCourses = [
          { year: 1, division: 1 }, { year: 1, division: 2 }, { year: 1, division: 3 }, { year: 1, division: 4 }, { year: 1, division: 5 },
          { year: 2, division: 1 }, { year: 2, division: 2 }, { year: 2, division: 3 }, { year: 2, division: 4 }, { year: 2, division: 5 },
          { year: 3, division: 1 }, { year: 3, division: 2 }, { year: 3, division: 3 }, { year: 3, division: 4 },
        ];
        for (const bc of basicCourses) {
          const name = `${bc.year}° ${bc.division}ª`;
          const exists = courses.some(c => c.shift_id === targetShiftId && (c.display_name === name || (c.year === bc.year && c.division === bc.division)));
          if (!exists) {
            await supabase.from('courses').insert({
              shift_id: targetShiftId,
              year: bc.year,
              division: bc.division,
              display_name: name,
              orientation_id: cbOrientation?.id || orientations[0]?.id,
              inscriptos_v: 15,
              inscriptos_m: 10,
              inscriptos_t: 25,
              cycle: 'basico',
              is_active: true
            });
            count++;
          }
        }
        showMessage(`Se agregaron ${count} cursos de Ciclo Básico en Turno ${targetShiftName}`, 'success');
      } else {
        showMessage(`Se agregaron ${data} cursos de Ciclo Básico en Turno ${targetShiftName}`, 'success');
      }
      fetchData();
    } catch (e: any) {
      showMessage(e.message || 'Error al precargar cursos', 'error');
    } finally {
      setSeedingBasico(false);
    }
  };

  const showMessage = (text: string, type: string) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // Filter courses based on shift tab
  const filteredCourses = courses.filter(c => {
    if (courseShiftFilter === 'all') return true;
    return c.shift_id === courseShiftFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
      </div>

      {msg.text && (
        <div className={`m-4 p-3 rounded text-sm font-medium ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 text-sm font-medium text-center flex items-center justify-center ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Users className="w-4 h-4 mr-2" /> Usuarios
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex-1 py-4 text-sm font-medium text-center flex items-center justify-center ${activeTab === 'assignments' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <BookOpen className="w-4 h-4 mr-2" /> Asignar Cursos
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex-1 py-4 text-sm font-medium text-center flex items-center justify-center ${activeTab === 'courses' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Layers className="w-4 h-4 mr-2" /> Cursos
        </button>
      </div>

      <div className="p-6">
        {loading && <p className="text-gray-500 text-center py-6">Cargando datos...</p>}

        {/* ========================================================================= */}
        {/* ======== TAB USUARIOS ======== */}
        {/* ========================================================================= */}
        {activeTab === 'users' && !loading && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Gestión de cuentas para preceptores y administradores.</p>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 space-y-4">
                <h3 className="font-semibold text-blue-900 text-lg">Nuevo Usuario (Preceptor)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                      type="text"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => { setShowCreateForm(false); setNewUser({ email: '', password: '', full_name: '' }); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={creating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                  >
                    {creating ? 'Creando...' : 'Crear Cuenta'}
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {editingId === p.id ? (
                          <input
                            type="text"
                            value={editData.full_name}
                            onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                            className="border border-blue-300 rounded px-2 py-1 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          p.full_name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === p.id ? (
                          <select
                            value={editData.role}
                            onChange={e => setEditData({ ...editData, role: e.target.value })}
                            className="border border-blue-300 rounded text-sm px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="preceptor">Preceptor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {p.role === 'admin' ? 'Admin' : 'Preceptor'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {editingId === p.id ? (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => saveEdit(p.id)} className="text-green-600 hover:text-green-800 p-1" title="Guardar">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 p-1" title="Cancelar">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => startEdit(p)} className="text-blue-600 hover:text-blue-800 p-1" title="Editar">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(p.id, p.full_name)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======== TAB ASIGNACIONES ======== */}
        {/* ========================================================================= */}
        {activeTab === 'assignments' && !loading && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Preceptor</label>
              <select 
                value={selectedProf}
                onChange={(e) => loadAssignments(e.target.value)}
                className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Seleccione...</option>
                {preceptors.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                ))}
              </select>
            </div>

            {selectedProf && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Cursos disponibles para asignar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={assignedCourses.includes(c.id)}
                        onChange={() => toggleAssignment(c.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {c.display_name} - {c.shifts?.name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={saveAssignments} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                    Guardar Asignaciones
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ======== TAB CURSOS ======== */}
        {/* ========================================================================= */}
        {activeTab === 'courses' && !loading && (
          <div className="space-y-6">
            {/* Header with Shift Filter & Actions */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-gray-200">
              {/* Turnos tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCourseShiftFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${courseShiftFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Todos ({courses.length})
                </button>
                {shifts.map(s => {
                  const count = courses.filter(c => c.shift_id === s.id).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCourseShiftFilter(s.id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${courseShiftFilter === s.id ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      Turno {s.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSeedTurnoMananaOficial}
                  disabled={seedingBasico}
                  title="Carga los 10 cursos oficiales de Ciclo Básico Turno Mañana con sus matrículas de alumnos (1°1°, 1°2°, 1°5°, 2°1°, 2°2°, 2°3°, 2°5°, 3°2°, 3°3°, 3°4°)"
                  className="inline-flex items-center px-3.5 py-2 bg-emerald-600 border border-emerald-700 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-emerald-100" />
                  {seedingBasico ? 'Cargando...' : 'Cargar Turno Mañana (10 Cursos Oficiales)'}
                </button>
                <button
                  onClick={handleSeedTurnoTardeOficial}
                  disabled={seedingBasico}
                  title="Carga los 10 cursos oficiales de Turno Tarde con sus matrículas de alumnos (1°3°, 1°4°, 2°4°, 3°1°, 4°1° a 4°3°, 5°1° a 5°3°)"
                  className="inline-flex items-center px-3.5 py-2 bg-amber-600 border border-amber-700 text-white rounded-lg hover:bg-amber-700 font-medium text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-amber-100" />
                  {seedingBasico ? 'Cargando...' : 'Cargar Turno Tarde (10 Cursos Oficiales)'}
                </button>
                <button
                  onClick={handleSeedCicloBasico}
                  disabled={seedingBasico}
                  title="Genera automáticamente 1°1ª a 1°5ª, 2°1ª a 2°5ª, 3°1ª a 3°4ª para el turno seleccionado"
                  className="inline-flex items-center px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
                  {seedingBasico ? 'Generando...' : 'Precargar Ciclo Básico General'}
                </button>
                <button
                  onClick={openNewCourseModal}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Curso
                </button>
              </div>
            </div>

            {/* Modal / Formulario de Creación / Edición */}
            {showCourseModal && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-blue-200 pb-3">
                  <h3 className="font-bold text-blue-950 text-lg">
                    {editingCourseId ? 'Editar Curso' : 'Crear Nuevo Curso'}
                  </h3>
                  <button
                    onClick={() => setShowCourseModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Año */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Año</label>
                    <select
                      value={courseForm.year}
                      onChange={e => handleYearChange(parseInt(e.target.value))}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map(y => (
                        <option key={y} value={y}>{y}° Año</option>
                      ))}
                    </select>
                  </div>

                  {/* División */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">División</label>
                    <select
                      value={courseForm.division}
                      onChange={e => handleDivisionChange(parseInt(e.target.value))}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6].map(d => (
                        <option key={d} value={d}>{d}ª División</option>
                      ))}
                    </select>
                  </div>

                  {/* Turno */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Turno</label>
                    <select
                      value={courseForm.shift_id}
                      onChange={e => setCourseForm({ ...courseForm, shift_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    >
                      <option value="">Seleccionar Turno...</option>
                      {shifts.map(s => (
                        <option key={s.id} value={s.id}>Turno {s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Orientación */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Orientación</label>
                    <select
                      value={courseForm.orientation_id}
                      onChange={e => {
                        const selectedO = orientations.find(o => o.id === e.target.value);
                        setCourseForm(prev => ({
                          ...prev,
                          orientation_id: e.target.value,
                          cycle: selectedO?.code === 'CB' ? 'basico' : (selectedO?.code === 'C.TEC.MMO' ? 'tecnico' : 'superior')
                        }));
                      }}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    >
                      <option value="">Seleccionar Orientación...</option>
                      {orientations.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.code} - {o.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombre a mostrar */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Nombre Visible</label>
                    <input
                      type="text"
                      value={courseForm.display_name}
                      onChange={e => setCourseForm({ ...courseForm, display_name: e.target.value })}
                      placeholder="Ej: 1° 1ª"
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-800"
                    />
                  </div>

                  {/* Inscriptos Varones */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Inscriptos Varones (V)</label>
                    <input
                      type="number"
                      min="0"
                      value={courseForm.inscriptos_v}
                      onChange={e => setCourseForm({ ...courseForm, inscriptos_v: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm text-center font-medium"
                    />
                  </div>

                  {/* Inscriptos Mujeres */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Inscriptos Mujeres (M)</label>
                    <input
                      type="number"
                      min="0"
                      value={courseForm.inscriptos_m}
                      onChange={e => setCourseForm({ ...courseForm, inscriptos_m: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm text-center font-medium"
                    />
                  </div>

                  {/* Total Inscriptos (Preview) */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Total Inscriptos (T)</label>
                    <div className="p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-center font-bold text-blue-900 text-sm">
                      {courseForm.inscriptos_v + courseForm.inscriptos_m} alumnos
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-blue-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="courseActive"
                      checked={courseForm.is_active}
                      onChange={e => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="courseActive" className="text-sm font-medium text-gray-700">
                      Curso activo en el sistema
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCourseModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveCourse}
                      disabled={savingCourse}
                      className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-medium text-sm shadow transition-colors disabled:opacity-50"
                    >
                      {savingCourse ? 'Guardando...' : (editingCourseId ? 'Actualizar Curso' : 'Crear Curso')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Table */}
            <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Turno</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Orientación</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ciclo</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Inscriptos (V / M / T)</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 italic">
                        No hay cursos registrados para este turno. Haz clic en <strong>"Nuevo Curso"</strong> o <strong>"Precargar Ciclo Básico"</strong> para agregar.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((c, idx) => (
                      <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {c.display_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                            {c.shifts?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                          <span className="text-blue-700 font-bold mr-1">{c.orientations?.code}</span>
                          <span className="text-xs text-gray-500 hidden sm:inline">({c.orientations?.full_name})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 capitalize">
                          {c.cycle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                          <span className="text-gray-700">{c.inscriptos_v}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-700">{c.inscriptos_m}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                            {c.inscriptos_t}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                          {c.is_active ? (
                            <span className="px-2.5 py-1 rounded-full font-bold bg-green-100 text-green-800">
                              Activo
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full font-bold bg-gray-100 text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openEditCourseModal(c)}
                              className="text-blue-600 hover:text-blue-900 p-1.5 rounded hover:bg-blue-50 transition-colors"
                              title="Editar curso e inscriptos"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.display_name)}
                              className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar curso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
