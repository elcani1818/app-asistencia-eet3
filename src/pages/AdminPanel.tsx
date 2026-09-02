import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Course, Shift, Orientation } from '../lib/types';
import { Users, BookOpen, Layers, Plus, Trash2, Pencil, X, Check } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'assignments' | 'courses'>('users');
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<(Course & { shifts: Shift, orientations: Orientation })[]>([]);
  const [preceptors, setPreceptors] = useState<Profile[]>([]);
  
  const [selectedProf, setSelectedProf] = useState<string>('');
  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });
  const [creating, setCreating] = useState(false);

  // Edit user
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ full_name: '', role: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('profiles').select('*').order('full_name');
      if (pData) {
        setProfiles(pData as Profile[]);
        setPreceptors(pData.filter(p => p.role === 'preceptor' || p.role === 'admin'));
      }

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

  // ---- CREATE USER ----
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

  // ---- EDIT USER ----
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

  // ---- DELETE USER ----
  const handleDelete = async (userId: string, name: string) => {
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

  // ---- ASSIGNMENTS ----
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

  const showMessage = (text: string, type: string) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
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

        {/* ======== TAB USUARIOS ======== */}
        {activeTab === 'users' && !loading && (
          <div className="space-y-6">
            {/* Botón crear */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </button>
            </div>

            {/* Formulario crear */}
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

            {/* Tabla usuarios */}
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
                            <button onClick={() => handleDelete(p.id, p.full_name)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
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

        {/* ======== TAB ASIGNACIONES ======== */}
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

        {/* ======== TAB CURSOS ======== */}
        {activeTab === 'courses' && !loading && (
          <div>
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
