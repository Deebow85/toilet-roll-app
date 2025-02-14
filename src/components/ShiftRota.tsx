import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, MessageSquare, ChevronDown, ZoomIn, ZoomOut, Upload, FileText, Clock } from 'lucide-react';

type ShiftType = {
  type: 'Day' | 'Night' | 'OT Day' | 'OT Night' | 'Holiday' | 'Swap Day (Owed)' | 'Swap Night (Owed)' | 'Swap Day (Done)' | 'Swap Night (Done)' | '18 Off' | null;
  note?: string;
  hours?: number;
};

const SHIFT_COLORS = {
  'Day': 'bg-[#4F7942] hover:bg-[#3e5e34] text-white', // Fern Green
  'Night': 'bg-[#E35335] hover:bg-[#d13f20] text-white', // Poppy Red
  'OT Day': 'bg-[#0047AB] hover:bg-[#003a89] text-white', // Electric Blue
  'OT Night': 'bg-[#FF9933] hover:bg-[#ff8000] text-white', // Illuminous Orange
  'Holiday': 'bg-[#CC9900] hover:bg-[#b38600] text-white', // Darker Yellow
  'Swap Day (Owed)': 'bg-[#00B7EB] hover:bg-[#0099c2] text-white', // Cyan
  'Swap Night (Owed)': 'bg-[#8B4513] hover:bg-[#723910] text-white', // Oak tree brown
  'Swap Day (Done)': 'bg-[#800080] hover:bg-[#660066] text-white', // Purple
  'Swap Night (Done)': 'bg-[#B8D5B8] hover:bg-[#a6c9a6] text-gray-700', // Lighter Moss Green
  '18 Off': 'bg-[#405959] hover:bg-[#334747] text-white', // Lighter Slate Grey
};

const ShiftRota = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<{ [key: string]: ShiftType }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [currentHours, setCurrentHours] = useState<number>(0);
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [patternFile, setPatternFile] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
      setPatternFile({ url: fileUrl, type: fileType });
      
      if (fileType === 'pdf') {
        setCurrentPage(1);
        setTotalPages(1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 50));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleNoteClick = (e: React.MouseEvent, date: string) => {
    e.stopPropagation(); // Prevent opening the shift selection modal
    setSelectedDate(date);
    setCurrentNote(shifts[date]?.note || '');
    setShowNoteModal(true);
  };

  const handleShiftSelect = (type: ShiftType['type']) => {
    if (selectedDate) {
      if (type === 'OT Day' || type === 'OT Night') {
        // First set the shift type
        setShifts(prev => ({
          ...prev,
          [selectedDate]: { 
            type,
            note: prev[selectedDate]?.note || '',
            hours: prev[selectedDate]?.hours || 0
          }
        }));
        // Then show hours modal
        setCurrentHours(shifts[selectedDate]?.hours || 0);
        setShowHoursModal(true);
      } else {
        setShifts(prev => ({
          ...prev,
          [selectedDate]: { type, note: prev[selectedDate]?.note || '' }
        }));
        setShowModal(false);
      }
    }
  };

  const handleSaveHours = () => {
    if (selectedDate) {
      setShifts(prev => ({
        ...prev,
        [selectedDate]: {
          ...prev[selectedDate],
          type: prev[selectedDate]?.type,
          hours: currentHours
        }
      }));
    }
    setShowHoursModal(false);
    setShowModal(false);
  };

  const handleAddNote = () => {
    if (selectedDate) {
      setCurrentNote(shifts[selectedDate]?.note || '');
      setShowNoteModal(true);
      setShowModal(false);
    }
  };

  const handleSaveNote = () => {
    if (selectedDate) {
      setShifts(prev => ({
        ...prev,
        [selectedDate]: { 
          ...prev[selectedDate], 
          note: currentNote,
          type: prev[selectedDate]?.type || null 
        }
      }));
    }
    setShowNoteModal(false);
  };

  const handleDeleteShift = () => {
    if (selectedDate) {
      const newShifts = { ...shifts };
      delete newShifts[selectedDate];
      setShifts(newShifts);
    }
    setShowModal(false);
  };

  const calculateMonthlyOTHours = () => {
    let totalHours = 0;
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    Object.entries(shifts).forEach(([dateStr, shift]) => {
      const shiftDate = new Date(dateStr);
      // Only count if shift is in current viewed month/year
      if (shiftDate.getFullYear() === currentYear && 
          shiftDate.getMonth() === currentMonth &&
          (shift.type === 'OT Day' || shift.type === 'OT Night') && 
          shift.hours) {
        totalHours += shift.hours;
      }
    });
    return totalHours;
  };

  const renderCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={`${showAllShifts ? 'h-8' : 'h-16'} bg-gray-50 border border-gray-200`}></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
      const shift = shifts[dateStr];
      const shiftColor = shift?.type ? SHIFT_COLORS[shift.type] : 'hover:bg-gray-100';

      days.push(
        <div
          key={dateStr}
          onClick={() => handleDateClick(dateStr)}
          className={`${showAllShifts ? 'h-8' : 'h-16'} border border-gray-200 p-1 cursor-pointer transition-colors ${shiftColor}`}
        >
          <div className="flex justify-between items-start">
            <span className={`font-semibold ${showAllShifts ? 'text-xs' : 'text-sm'} ${shift?.type ? 'text-white' : ''}`}>
              {day}
            </span>
            <div className="flex items-center gap-1">
              {shift?.hours && (shift.type === 'OT Day' || shift.type === 'OT Night') && (
                <span className="text-xs bg-white bg-opacity-50 px-1 rounded">
                  {shift.hours}h
                </span>
              )}
              {shift?.note && (
                <button
                  onClick={(e) => handleNoteClick(e, dateStr)}
                  className="p-0.5 rounded hover:bg-black/10"
                >
                  <MessageSquare 
                    className={`
                      ${showAllShifts ? 'w-2.5 h-2.5' : 'w-3 h-3'} 
                      ${shift.type ? 'text-white' : 'text-gray-600'}
                    `} 
                  />
                </button>
              )}
            </div>
          </div>
          {shift?.type && (
            <div className={`${showAllShifts ? 'text-[10px]' : 'text-xs'} mt-0.5 truncate text-white`}>
              {shift.type}
            </div>
          )}
          {shift?.note && !showAllShifts && (
            <div className={`text-[10px] mt-0.5 truncate ${shift.type ? 'text-white/90' : 'text-gray-600'}`}>
              {shift.note}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Monthly OT Hours: {calculateMonthlyOTHours()}</span>
          </div>
          <button
            onClick={() => setShowAllShifts(!showAllShifts)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span>View All Shift Pattern</span>
            <ChevronDown className={`w-4 h-4 transform transition-transform ${showAllShifts ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className={`space-y-3 ${showAllShifts ? 'mb-3' : ''}`}>
          <div className={`bg-white rounded-lg shadow-md p-2 sm:p-3 transition-all duration-300 ${showAllShifts ? 'scale-98' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className={`${showAllShifts ? 'text-base' : 'text-lg'} font-semibold`}>
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={`text-center font-semibold py-1 bg-gray-50 ${showAllShifts ? 'text-xs' : 'text-sm'}`}>
                  {showAllShifts ? day.slice(0, 1) : day.slice(0, 3)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-white">
              {renderCalendar()}
            </div>
          </div>

          {showAllShifts && (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold">All Shifts Pattern</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Pattern</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 hover:bg-gray-100 rounded-full"
                      disabled={zoomLevel <= 50}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-600">{zoomLevel}%</span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 hover:bg-gray-100 rounded-full"
                      disabled={zoomLevel >= 200}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-auto max-h-[60vh]">
                {patternFile ? (
                  <div>
                    {patternFile.type === 'pdf' && (
                      <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage <= 1}
                            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
                      {patternFile.type === 'image' ? (
                        <img
                          src={patternFile.url}
                          alt="All Shifts Pattern"
                          className="w-full h-auto"
                        />
                      ) : (
                        <iframe
                          src={`${patternFile.url}#page=${currentPage}`}
                          className="w-full min-h-[600px] border-0"
                          title="PDF Viewer"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p>Upload a shift pattern (Image or PDF)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shift Type Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Object.entries(SHIFT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${color}`}></div>
            <span className="text-xs">{type}</span>
          </div>
        ))}
      </div>

      {/* Shift Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold">Select Shift Type</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              {Object.keys(SHIFT_COLORS).map(type => (
                <button
                  key={type}
                  onClick={() => handleShiftSelect(type as ShiftType['type'])}
                  className={`w-full p-2 rounded text-left text-sm ${SHIFT_COLORS[type]} transition-colors`}
                >
                  {type}
                </button>
              ))}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleAddNote}
                  className="flex-1 bg-blue-500 text-white p-2 rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
                <button
                  onClick={handleDeleteShift}
                  className="flex-1 bg-red-500 text-white p-2 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold">Add Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="w-full h-32 p-2 border rounded resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your note here..."
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hours Modal */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold">Enter Overtime Hours</h3>
              <button onClick={() => setShowHoursModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="number"
              value={currentHours}
              onChange={(e) => setCurrentHours(Math.max(0, Number(e.target.value)))}
              className="w-full p-2 border rounded mb-4"
              min="0"
              step="0.5"
              placeholder="Enter hours worked"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowHoursModal(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHours}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftRota;