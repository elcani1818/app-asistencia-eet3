import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Course } from '../lib/types';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const AttendanceForm = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    presentes_v: 0,
    presentes_m: 0,
    ausentes_v: 0,
    ausentes_m: 0,
    observaciones: '',
    ausencia_docentes: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      loadExistingRecord(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    if (!user) return;
    try {
      const { data: profCourses, error: profError } = await supabase
        .from('professor_courses')
        .select('course_id')
        .eq('professor_id', user.id);

      if (profError) throw profError;

      if (profCourses && profCourses.length > 0) {
        const courseIds = profCourses.map(pc => pc.course_id);
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`*, orientations (code)`)
          .in('id', courseIds)
          .eq('is_active', true);

        if (coursesError) throw coursesError;
        setCourses(coursesData as unknown as Course[]);
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setMessage({ type: 'error', text: 'Error al cargar los cursos.' });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingRecord = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('course_id', courseId)
        .eq('record_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFormData({
          presentes_v: data.presentes_v,
          presentes_m: data.presentes_m,
          ausentes_v: data.ausentes_v,
          ausentes_m: data.ausentes_m,
          observaciones: data.observaciones || '',
          ausencia_docentes: data.ausencia_docentes || ''
        });
      } else {
        // Reset if no record
        setFormData({
          presentes_v: 0,
          presentes_m: 0,
          ausentes_v: 0,
          ausentes_m: 0,
          observaciones: '',
          ausencia_docentes: ''
        });
      }
    } catch (error) {
      console.error('Error loading record:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = name.includes('presentes') || name.includes('ausentes');
    
    setFormData(prev => ({
      ...prev,
      [name]: isNumber ? parseInt(value) || 0 : value
    }));
  };

  const currentCourse = courses.find(c => c.id === selectedCourse);
  const presentes_t = formData.presentes_v + formData.presentes_m;
  const ausentes_t = formData.ausentes_v + formData.ausentes_m;

  const validateForm = () => {
    if (!currentCourse) return false;
    
    if (formData.presentes_v + formData.ausentes_v !== currentCourse.inscriptos_v) {
      setMessage({ type: 'error', text: `Varones: Presentes + Ausentes debe ser igual a Inscriptos (${currentCourse.inscriptos_v})` });
      return false;
    }
    if (formData.presentes_m + formData.ausentes_m !== currentCourse.inscriptos_m) {
      setMessage({ type: 'error', text: `Mujeres: Presentes + Ausentes debe ser igual a Inscriptos (${currentCourse.inscriptos_m})` });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!validateForm() || !user || !currentCourse) return;

    setSaving(true);
    try {
      const record = {
        course_id: currentCourse.id,
        record_date: today,
        presentes_v: formData.presentes_v,
        presentes_m: formData.presentes_m,
        ausentes_v: formData.ausentes_v,
        ausentes_m: formData.ausentes_m,
        observaciones: formData.observaciones,
        ausencia_docentes: formData.ausencia_docentes,
        submitted_by: user.id
      };

      const { error } = await supabase
        .from('attendance_records')
        .upsert(record, { onConflict: 'course_id,record_date' });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Asistencia guardada correctamente.' });
    } catch (error: any) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Error al guardar. Intente nuevamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  if (courses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sin cursos asignados</h2>
        <p className="text-gray-600">No tiene cursos asignados para cargar asistencia.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Cargar Asistencia</h1>
          <div className="text-gray-600 bg-gray-100 px-4 py-2 rounded-md font-medium mt-4 md:mt-0">
            Fecha: {new Date().toLocaleDateString('es-AR')}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-md mb-6 flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Curso</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.display_name} - {course.orientations?.code || ''}
                </option>
              ))}
            </select>
          </div>

          {currentCourse && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg flex flex-wrap gap-4 text-sm">
                <div className="font-semibold text-blue-900">Inscriptos Totales: {currentCourse.inscriptos_t}</div>
                <div className="text-blue-800">Varones: {currentCourse.inscriptos_v}</div>
                <div className="text-blue-800">Mujeres: {currentCourse.inscriptos_m}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Presentes */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-green-700 mb-4 border-b pb-2">Presentes</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Varones</label>
                      <input
                        type="number"
                        min="0"
                        name="presentes_v"
                        value={formData.presentes_v}
                        onChange={handleInputChange}
                        className="w-24 p-2 border border-gray-300 rounded-md text-right focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Mujeres</label>
                      <input
                        type="number"
                        min="0"
                        name="presentes_m"
                        value={formData.presentes_m}
                        onChange={handleInputChange}
                        className="w-24 p-2 border border-gray-300 rounded-md text-right focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-semibold">
                      <span>Total Presentes</span>
                      <span className="text-green-700 bg-green-100 px-3 py-1 rounded">{presentes_t}</span>
                    </div>
                  </div>
                </div>

                {/* Ausentes */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-red-700 mb-4 border-b pb-2">Ausentes</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Varones</label>
                      <input
                        type="number"
                        min="0"
                        name="ausentes_v"
                        value={formData.ausentes_v}
                        onChange={handleInputChange}
                        className="w-24 p-2 border border-gray-300 rounded-md text-right focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Mujeres</label>
                      <input
                        type="number"
                        min="0"
                        name="ausentes_m"
                        value={formData.ausentes_m}
                        onChange={handleInputChange}
                        className="w-24 p-2 border border-gray-300 rounded-md text-right focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-semibold">
                      <span>Total Ausentes</span>
                      <span className="text-red-700 bg-red-100 px-3 py-1 rounded">{ausentes_t}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detalles adicionales, retiros anticipados, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ausencia de Docentes</label>
                  <textarea
                    name="ausencia_docentes"
                    value={formData.ausencia_docentes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Indique profesores ausentes en este curso"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-3 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;
