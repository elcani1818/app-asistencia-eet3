import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Course, Shift, AttendanceRecord, Orientation } from '../lib/types';
import { Download, FileText, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type RecordWithCourse = AttendanceRecord & {
  courses: Course & { orientations: Orientation };
};

const Dashboard = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [records, setRecords] = useState<RecordWithCourse[]>([]);
  const [allCoursesForShift, setAllCoursesForShift] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  useEffect(() => {
    if (selectedShift) {
      fetchData();
      fetchChartData();
    }
  }, [selectedShift, selectedDate]);

  const fetchShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setShifts(data as Shift[]);
      if (data && data.length > 0) {
        setSelectedShift(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all active courses for the shift
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`*, orientations (code)`)
        .eq('shift_id', selectedShift)
        .eq('is_active', true)
        .order('year')
        .order('division');

      if (coursesError) throw coursesError;
      setAllCoursesForShift(coursesData as unknown as Course[]);

      // Fetch attendance records for date and shift courses
      const courseIds = coursesData.map(c => c.id);
      
      if (courseIds.length > 0) {
        const { data: recordsData, error: recordsError } = await supabase
          .from('attendance_records')
          .select(`*, courses!inner(*, orientations(code))`)
          .in('course_id', courseIds)
          .eq('record_date', selectedDate);

        if (recordsError) throw recordsError;
        setRecords(recordsData as unknown as RecordWithCourse[]);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      // Last 30 days logic (simplified for the chart)
      const date30DaysAgo = new Date();
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
      const pastDate = date30DaysAgo.toISOString().split('T')[0];

      // Get courses for shift
      const { data: shiftCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('shift_id', selectedShift);
      
      if (!shiftCourses || shiftCourses.length === 0) {
        setChartData([]);
        return;
      }
      
      const courseIds = shiftCourses.map(c => c.id);

      const { data, error } = await supabase
        .from('attendance_records')
        .select('record_date, presentes_t, ausentes_t')
        .in('course_id', courseIds)
        .gte('record_date', pastDate);

      if (error) throw error;

      // Aggregate by date
      const aggregated: Record<string, { presentes: number, ausentes: number }> = {};
      data.forEach(r => {
        if (!aggregated[r.record_date]) {
          aggregated[r.record_date] = { presentes: 0, ausentes: 0 };
        }
        aggregated[r.record_date].presentes += r.presentes_t;
        aggregated[r.record_date].ausentes += r.ausentes_t;
      });

      const chartPoints = Object.keys(aggregated).sort().map(date => {
        const total = aggregated[date].presentes + aggregated[date].ausentes;
        const pct = total > 0 ? (aggregated[date].presentes / total) * 100 : 0;
        return {
          fecha: date.substring(5), // MM-DD
          porcentaje: parseFloat(pct.toFixed(1))
        };
      });

      setChartData(chartPoints);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Combine courses with their records
  const tableData = allCoursesForShift.map(course => {
    const record = records.find(r => r.course_id === course.id);
    return {
      course,
      record: record || null
    };
  });

  // Calculate Totals
  const totals = tableData.reduce((acc, curr) => {
    const { course, record } = curr;
    acc.inscriptos_v += course.inscriptos_v;
    acc.inscriptos_m += course.inscriptos_m;
    acc.inscriptos_t += course.inscriptos_t;
    
    if (record) {
      acc.presentes_v += record.presentes_v;
      acc.presentes_m += record.presentes_m;
      acc.presentes_t += record.presentes_t;
      acc.ausentes_v += record.ausentes_v;
      acc.ausentes_m += record.ausentes_m;
      acc.ausentes_t += record.ausentes_t;
    }
    return acc;
  }, {
    inscriptos_v: 0, inscriptos_m: 0, inscriptos_t: 0,
    presentes_v: 0, presentes_m: 0, presentes_t: 0,
    ausentes_v: 0, ausentes_m: 0, ausentes_t: 0
  });

  const shiftName = shifts.find(s => s.id === selectedShift)?.name || '';

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const wsData = [
      ['PARTE DIARIO - ESC. DE EDUC. TÉCNICA N°3'],
      [`Turno: ${shiftName}`, `Fecha: ${selectedDate}`],
      [],
      ['Curso', 'Orientación', 'Inscriptos V', 'Inscriptos M', 'Inscriptos T', 'Presentes V', 'Presentes M', 'Presentes T', 'Ausentes V', 'Ausentes M', 'Ausentes T']
    ];

    tableData.forEach(row => {
      wsData.push([
        row.course.display_name,
        (row.course as any).orientations?.code || '',
        row.course.inscriptos_v,
        row.course.inscriptos_m,
        row.course.inscriptos_t,
        row.record?.presentes_v || 0,
        row.record?.presentes_m || 0,
        row.record?.presentes_t || 0,
        row.record?.ausentes_v || 0,
        row.record?.ausentes_m || 0,
        row.record?.ausentes_t || 0
      ]);
    });

    wsData.push([
      'TOTALES',
      '',
      totals.inscriptos_v.toString(), totals.inscriptos_m.toString(), totals.inscriptos_t.toString(),
      totals.presentes_v.toString(), totals.presentes_m.toString(), totals.presentes_t.toString(),
      totals.ausentes_v.toString(), totals.ausentes_m.toString(), totals.ausentes_t.toString()
    ]);

    wsData.push([]);
    wsData.push(['OBSERVACIONES Y NOVEDADES']);
    tableData.filter(r => r.record?.observaciones || r.record?.ausencia_docentes).forEach(row => {
      wsData.push([row.course.display_name]);
      if (row.record?.observaciones) wsData.push(['Obs:', row.record.observaciones]);
      if (row.record?.ausencia_docentes) wsData.push(['Docentes ausentes:', row.record.ausencia_docentes]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Parte General");
    XLSX.writeFile(wb, `Parte_${shiftName}_${selectedDate}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('PARTE DIARIO - ESC. DE EDUC. TÉCNICA N°3', 14, 15);
    doc.setFontSize(12);
    doc.text(`Turno: ${shiftName} | Fecha: ${selectedDate}`, 14, 25);

    const tableHeaders = [['Curso', 'Orient', 'Insc V', 'Insc M', 'Insc T', 'Pres V', 'Pres M', 'Pres T', 'Aus V', 'Aus M', 'Aus T']];
    
    const tableRows = tableData.map(row => [
      row.course.display_name,
      (row.course as any).orientations?.code || '',
      row.course.inscriptos_v,
      row.course.inscriptos_m,
      row.course.inscriptos_t,
      row.record?.presentes_v ?? '-',
      row.record?.presentes_m ?? '-',
      row.record?.presentes_t ?? '-',
      row.record?.ausentes_v ?? '-',
      row.record?.ausentes_m ?? '-',
      row.record?.ausentes_t ?? '-'
    ]);

    tableRows.push([
      'TOTALES', '',
      totals.inscriptos_v.toString(), totals.inscriptos_m.toString(), totals.inscriptos_t.toString(),
      totals.presentes_v.toString(), totals.presentes_m.toString(), totals.presentes_t.toString(),
      totals.ausentes_v.toString(), totals.ausentes_m.toString(), totals.ausentes_t.toString()
    ]);

    autoTable(doc, {
      startY: 30,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    // Novedades
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    const recordsWithNotes = tableData.filter(r => r.record?.observaciones || r.record?.ausencia_docentes);
    
    if (recordsWithNotes.length > 0) {
      doc.setFontSize(12);
      doc.text('OBSERVACIONES Y AUSENCIA DE DOCENTES', 14, finalY);
      finalY += 5;
      
      doc.setFontSize(9);
      recordsWithNotes.forEach(row => {
        if (finalY > 190) {
          doc.addPage();
          finalY = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${row.course.display_name}:`, 14, finalY);
        doc.setFont('helvetica', 'normal');
        finalY += 5;
        
        if (row.record?.observaciones) {
          const splitObs = doc.splitTextToSize(`Obs: ${row.record.observaciones}`, 260);
          doc.text(splitObs, 14, finalY);
          finalY += splitObs.length * 4 + 2;
        }
        
        if (row.record?.ausencia_docentes) {
          const splitDoc = doc.splitTextToSize(`Docentes ausentes: ${row.record.ausencia_docentes}`, 260);
          doc.text(splitDoc, 14, finalY);
          finalY += splitDoc.length * 4 + 4;
        }
      });
    }

    doc.save(`Parte_${shiftName}_${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Asistencia</h1>
          
          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-500 w-5 h-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-700"
            />
          </div>
        </div>

        {/* Tabs for Shifts */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {shifts.map(shift => (
              <button
                key={shift.id}
                onClick={() => setSelectedShift(shift.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${selectedShift === shift.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Turno {shift.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={exportExcel}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg mb-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th rowSpan={2} className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">Curso</th>
                <th rowSpan={2} className="px-3 py-3.5 text-left text-sm font-semibold">Orientación</th>
                <th colSpan={3} className="px-3 py-2 text-center text-sm font-semibold border-b border-blue-700 border-l border-blue-700">Inscriptos</th>
                <th colSpan={3} className="px-3 py-2 text-center text-sm font-semibold border-b border-blue-700 border-l border-blue-700">Presentes</th>
                <th colSpan={3} className="px-3 py-2 text-center text-sm font-semibold border-b border-blue-700 border-l border-blue-700">Ausentes</th>
              </tr>
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium border-l border-blue-700 bg-blue-700">V</th>
                <th className="px-2 py-2 text-center text-xs font-medium bg-blue-700">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium bg-blue-700">T</th>
                <th className="px-2 py-2 text-center text-xs font-medium border-l border-blue-700 bg-blue-700">V</th>
                <th className="px-2 py-2 text-center text-xs font-medium bg-blue-700">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium bg-blue-700">T</th>
                <th className="px-2 py-2 text-center text-xs font-medium border-l border-blue-700 bg-blue-700">V</th>
                <th className="px-2 py-2 text-center text-xs font-medium bg-blue-700">M</th>
                <th className="px-2 py-2 text-center text-xs font-medium bg-blue-700">T</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={11} className="py-10 text-center text-gray-500">Cargando datos...</td></tr>
              ) : tableData.length === 0 ? (
                <tr><td colSpan={11} className="py-10 text-center text-gray-500">No hay cursos para este turno.</td></tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr key={row.course.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{row.course.display_name}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{(row.course as any).orientations?.code}</td>
                    
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center text-gray-500 border-l">{row.course.inscriptos_v}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center text-gray-500">{row.course.inscriptos_m}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center font-medium text-gray-900 bg-gray-100">{row.course.inscriptos_t}</td>
                    
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center text-gray-500 border-l">{row.record?.presentes_v ?? '-'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center text-gray-500">{row.record?.presentes_m ?? '-'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center font-medium text-green-700 bg-green-50">{row.record?.presentes_t ?? '-'}</td>
                    
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center text-gray-500 border-l">{row.record?.ausentes_v ?? '-'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center text-gray-500">{row.record?.ausentes_m ?? '-'}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-center font-medium text-red-700 bg-red-50">{row.record?.ausentes_t ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && tableData.length > 0 && (
              <tfoot className="bg-gray-200">
                <tr>
                  <td colSpan={2} className="py-3 pl-4 pr-3 text-sm font-bold text-gray-900 sm:pl-6">TOTALES</td>
                  <td className="px-3 py-3 text-sm text-center font-bold border-l border-gray-300">{totals.inscriptos_v}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">{totals.inscriptos_m}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold bg-gray-300">{totals.inscriptos_t}</td>
                  
                  <td className="px-3 py-3 text-sm text-center font-bold border-l border-gray-300">{totals.presentes_v}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">{totals.presentes_m}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold text-green-800 bg-green-200">{totals.presentes_t}</td>
                  
                  <td className="px-3 py-3 text-sm text-center font-bold border-l border-gray-300">{totals.ausentes_v}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold">{totals.ausentes_m}</td>
                  <td className="px-3 py-3 text-sm text-center font-bold text-red-800 bg-red-200">{totals.ausentes_t}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Observaciones section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Novedades y Observaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tableData.filter(r => r.record?.observaciones || r.record?.ausencia_docentes).length === 0 ? (
              <p className="text-gray-500 italic col-span-2">No hay observaciones para mostrar en esta fecha.</p>
            ) : (
              tableData.filter(r => r.record?.observaciones || r.record?.ausencia_docentes).map(row => (
                <div key={`obs-${row.course.id}`} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-yellow-800 mb-2">{row.course.display_name}</h4>
                  {row.record?.observaciones && (
                    <div className="mb-2">
                      <span className="font-semibold text-sm text-yellow-900 block">Observaciones:</span>
                      <p className="text-sm text-yellow-800 whitespace-pre-wrap">{row.record.observaciones}</p>
                    </div>
                  )}
                  {row.record?.ausencia_docentes && (
                    <div>
                      <span className="font-semibold text-sm text-yellow-900 block">Docentes Ausentes:</span>
                      <p className="text-sm text-red-700 font-medium whitespace-pre-wrap">{row.record.ausencia_docentes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Asistencia últimos 30 días (%)</h3>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="porcentaje" name="% Presentes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No hay datos suficientes para el gráfico
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
