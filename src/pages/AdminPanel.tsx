import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Course, Shift, Orientation } from '../lib/types';
import { Users, BookOpen, Layers } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'courses'>('users');
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<(Course & { shifts: Shift, orientations: Orientation })[]>([]);
  const [professors, setProfessors] = useState<Profile[]>([]);
  
  const [selectedProf, setSelectedProf] = useState<string>('');
  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Profiles
      const { data: pData } = await supabase.from('profiles').select('*').order('full_name');
      if (pData) {
        setProfiles(pData as Profile[]);
        setProfessors(pData.filter(p => p.role === 'profesor' || p.role === 'admin'));
      }

      // Courses
      const { data: cData } = await supabase
        .from('courses')
        .select(`*, shifts(name), orientations(code)`)
        .order('year')
        .order('division');
      if (cData) setCourses(cData as any);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await supabase.from('profiles').update({ role }).eq('id', userId);
      fetchData();
      showMessage('Rol actualizado', 'success');
    } catch (e) {
      showMessage('Error al actualizar', 'error');
    }
  };

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', userId);
      fetchData();
      showMessage('Estado actualizado', 'success');
    } catch (e) {
      showMessage('Error al actualizar', 'error');
    }
  };

  const loadAssignments = async (profId: string) => {
    setSelectedProf(profId);
    if (!profId) {
      setAssignedCourses([]);
      return;
    }
    try {
      const { data } = await supabase.from('professor_courses').select('course_id').eq('professor_id', profId);
      if (data) {
        setAssignedCourses(data.map(d => d.course_id));
      }
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

  const showMessage = (text: string, type: string) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

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
        {loading && <p>Cargando datos...</p>}

        {/* Tab Usuarios */}
        {activeTab === 'users' && !loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select 
                        value={p.role} 
                        onChange={(e) => handleRoleChange(p.id, e.target.value)}
                        className="border-gray-300 rounded text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="preceptor">Preceptor</option>
                        <option value="profesor">Profesor</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => toggleActive(p.id, p.is_active)}
                        className={`px-3 py-1 rounded text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab Asignaciones */}
        {activeTab === 'assignments' && !loading && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Docente / Preceptor</label>
              <select 
                value={selectedProf}
                onChange={(e) => loadAssignments(e.target.value)}
                className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded-lg"
              >
                <option value="">Seleccione...</option>
                {professors.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                ))}
              </select>
            </div>

            {selectedProf && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Cursos disponibles</h3>
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

        {/* Tab Cursos */}
        {activeTab === 'courses' && !loading && (
          <div>
            <p className="text-gray-500 mb-4">La edición completa de cursos requiere implementar modales. Por ahora, se listan los cursos en el sistema.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orientación</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Inscriptos (V/M/T)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map(c => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.display_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.shifts?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.orientations?.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {c.inscriptos_v} / {c.inscriptos_m} / <span className="font-bold">{c.inscriptos_t}</span>
                      </td>
                    </tr>
                  ))}
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
