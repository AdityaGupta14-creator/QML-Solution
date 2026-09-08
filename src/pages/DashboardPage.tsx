import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatient } from '@/contexts/PatientContext';
import { useAuth } from '@/contexts/AuthContext';
import { PATIENTS_LIST } from '@/data/patients';
import { Search, ArrowRight, ArrowLeft, ShieldAlert, Activity, UserCheck, ArrowUpDown, Sparkles } from 'lucide-react';
import { RiskGauge } from '@/components/RiskGauge';

type FilterType = 'All' | 'Critical' | 'Urgent' | 'Stable';
type SortOption = 'qml-desc' | 'qml-asc' | 'triage' | 'name';

export function DashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [sortBy, setSortBy] = useState<SortOption>('qml-desc');
  
  const { selectPatient } = usePatient();
  const navigate = useNavigate();

  // Calculate cohort-wide QML risk rank for each patient (Rank #1 = highest risk)
  const qmlRankMap = useMemo(() => {
    const sorted = [...PATIENTS_LIST].sort((a, b) => b.qmlRiskScore - a.qmlRiskScore);
    const map = new Map<string, number>();
    sorted.forEach((p, idx) => map.set(p.id, idx + 1));
    return map;
  }, []);

  const filteredPatients = useMemo(() => {
    const list = PATIENTS_LIST.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.mrn.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === 'All' || p.triageLevel === activeFilter;
      
      return matchesSearch && matchesFilter;
    });

    return list.sort((a, b) => {
      if (sortBy === 'qml-desc') return b.qmlRiskScore - a.qmlRiskScore;
      if (sortBy === 'qml-asc') return a.qmlRiskScore - b.qmlRiskScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'triage') {
        const priority: Record<string, number> = { Critical: 3, Urgent: 2, Stable: 1 };
        return (priority[b.triageLevel] || 0) - (priority[a.triageLevel] || 0);
      }
      return b.qmlRiskScore - a.qmlRiskScore;
    });
  }, [searchQuery, activeFilter, sortBy]);

  const criticalCount = PATIENTS_LIST.filter(p => p.triageLevel === 'Critical').length;
  const avgQmlRisk = Math.round(PATIENTS_LIST.reduce((acc, p) => acc + p.qmlRiskScore, 0) / (PATIENTS_LIST.length || 1));
  const highestRiskPatient = useMemo(() => {
    return [...PATIENTS_LIST].sort((a, b) => b.qmlRiskScore - a.qmlRiskScore)[0];
  }, []);

  const handleReviewPatient = (id: string) => {
    selectPatient(id);
    navigate(`/patient/${id}`);
  };

  const getBorderColor = (level: string) => {
    switch(level) {
      case 'Critical': return 'border-l-[#c2484a]';
      case 'Urgent': return 'border-l-[#c49332]';
      case 'Stable': return 'border-l-[#5a8a6e]';
      default: return 'border-l-[#d4d0ca]';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2eb] pt-4 sm:pt-6 pb-16 font-sans text-[#111111] animate-fade-in">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-8 lg:px-12">
        
        {/* Navigation & Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e2d9] pb-6 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/login" className="text-xs font-semibold text-[#6b6b6b] hover:text-[#111] transition-colors flex items-center gap-1">
                <ArrowLeft size={14} /> Back to Home
              </Link>
              <span className="text-[#9a9590]">|</span>
              <span className="text-xs font-mono text-[#5a8a6e] font-semibold uppercase tracking-wider">Hospital Node #IN-DELHI-04</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#111111]">Active Patient Surveillance Queue</h1>
            <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">Real-time QML Tuberculosis Risk Monitoring & Clinical Triage</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-full border border-[#5a8a6e]/30 bg-[#5a8a6e]/10 text-[#5a8a6e] text-xs font-mono font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5a8a6e] animate-pulse" />
              <span>6 Active In-Patient Telemetry Feeds</span>
            </div>
          </div>
        </div>

        {/* Doctor Session & QML Ranking Banner */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#d4d0ca] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#a8d5ba] flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-xs">
              QML
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#111111]">
                  {user?.name ? `${user.name} • ${user.role}` : 'Clinical Attending Surveillance'}
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#c2484a]/10 text-[#c2484a] border border-[#c2484a]/20 flex items-center gap-1">
                  <Sparkles size={11} /> Auto-Ranked by QML Risk Score
                </span>
              </div>
              <p className="text-xs text-[#6b6b6b] mt-0.5">
                Surveillance queue is dynamically ranked by 8-qubit QML Risk Score. Patients requiring urgent clinical triage appear at the top.
              </p>
            </div>
          </div>
          {highestRiskPatient && (
            <div 
              onClick={() => handleReviewPatient(highestRiskPatient.id)}
              className="bg-[#faf9f7] hover:bg-[#f4f2eb] transition-colors border border-[#e5e2d9] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer group shrink-0"
              title="Quickly review the top prioritized patient"
            >
              <div>
                <div className="text-[10px] font-mono text-[#c2484a] uppercase font-bold tracking-wider">Priority #1 Patient</div>
                <div className="text-xs font-bold text-[#111111] group-hover:text-[#4a7c6f] transition-colors">
                  {highestRiskPatient.name} ({highestRiskPatient.qmlRiskScore}% Risk)
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9a9590] group-hover:text-[#111] group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
        </div>

        {/* Prominent Stats Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-[#d4d0ca] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#6b6b6b]">Total Cohort Patients</span>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] mt-1">{PATIENTS_LIST.length}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#f4f2eb] flex items-center justify-center text-[#111111]">
              <UserCheck size={24} />
            </div>
          </div>

          <div className="bg-white p-5 sm:p-7 rounded-2xl border border-[#d4d0ca] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#6b6b6b]">High Risk Critical Cases</span>
              <div className="font-serif text-3xl sm:text-4xl font-bold text-[#c2484a] mt-1">{criticalCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#c2484a]/10 flex items-center justify-center text-[#c2484a]">
              <ShieldAlert size={24} />
            </div>
          </div>

          <div className="bg-[#111111] text-white p-5 sm:p-7 rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#a8d5ba]">Mean QML Risk Score</span>
              <div className="font-mono text-3xl sm:text-4xl font-bold text-[#a8d5ba] mt-1">{avgQmlRisk}%</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#222222] flex items-center justify-center text-[#a8d5ba]">
              <Activity size={24} />
            </div>
          </div>
        </div>

        {/* Filters, Sort and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex gap-2 flex-wrap items-center">
            {(['All', 'Critical', 'Urgent', 'Stable'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-[#111111] text-white shadow'
                    : 'bg-white border border-[#d4d0ca] text-[#6b6b6b] hover:border-[#111111]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#d4d0ca] rounded-xl px-3 py-2">
              <ArrowUpDown size={14} className="text-[#6b6b6b] shrink-0" />
              <label htmlFor="sort-patients" className="text-xs font-mono text-[#6b6b6b] whitespace-nowrap">Rank by:</label>
              <select
                id="sort-patients"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-semibold text-[#111111] focus:outline-none cursor-pointer pr-1"
              >
                <option value="qml-desc">QML Risk Score (High → Low)</option>
                <option value="qml-asc">QML Risk Score (Low → High)</option>
                <option value="triage">Triage Severity (Critical First)</option>
                <option value="name">Patient Name (A-Z)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9590]" />
              <input
                type="text"
                placeholder="Search patient, MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#d4d0ca] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#111111] transition-colors text-[#111111] placeholder:text-[#9a9590]"
              />
            </div>
          </div>
        </div>

        {/* Fully Clickable Patient Grid Cards */}
        <div className="space-y-4 sm:space-y-5">
          {filteredPatients.map((patient) => {
            const rank = qmlRankMap.get(patient.id) || 1;
            return (
              <div 
                key={patient.id}
                onClick={() => handleReviewPatient(patient.id)}
                className={`bg-white rounded-2xl border border-[#d4d0ca] border-l-[6px] ${getBorderColor(patient.triageLevel)} shadow-sm hover:shadow-md hover:border-[#111111] transition-all p-4 sm:p-7 flex flex-col md:flex-row items-stretch md:items-center gap-5 sm:gap-8 cursor-pointer group`}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                        rank === 1 
                          ? 'bg-[#c2484a] text-white shadow-xs' 
                          : rank === 2 
                          ? 'bg-[#c2484a]/15 text-[#c2484a] border border-[#c2484a]/30'
                          : rank <= 4 
                          ? 'bg-[#c49332]/15 text-[#c49332] border border-[#c49332]/30'
                          : 'bg-[#f4f2eb] text-[#6b6b6b] border border-[#d4d0ca]'
                      }`}>
                        {rank === 1 && <Sparkles size={12} className="text-white animate-pulse" />}
                        Rank #{rank} Priority
                      </span>
                      <h2 className="font-serif text-2xl font-bold text-[#111111] group-hover:text-[#4a7c6f] transition-colors">
                        {patient.name}
                      </h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      patient.triageLevel === 'Critical' ? 'bg-[#c2484a]/10 text-[#c2484a]' :
                      patient.triageLevel === 'Urgent' ? 'bg-[#c49332]/10 text-[#c49332]' : 'bg-[#5a8a6e]/10 text-[#5a8a6e]'
                    }`}>
                      {patient.triageLevel}
                    </span>
                  </div>

                  <div className="text-xs text-[#6b6b6b] flex flex-wrap items-center gap-3 font-mono">
                    <span>{patient.age} years</span>
                    <span>•</span>
                    <span>{patient.gender}</span>
                    <span>•</span>
                    <span>MRN: {patient.mrn}</span>
                    <span>•</span>
                    <span>Bed: {patient.bed}</span>
                    <span>•</span>
                    <span className="text-[#111111] font-semibold">Attending: {patient.attendingPhysician}</span>
                  </div>
                  
                  <div className="bg-[#faf9f7] p-3.5 rounded-xl border border-[#e5e2d9] text-xs space-y-1">
                    <p className="text-[#111]"><strong className="text-[#6b6b6b]">Chief Complaint:</strong> {patient.chiefComplaint}</p>
                    <p className="text-[#111]"><strong className="text-[#6b6b6b]">Primary Diagnosis:</strong> {patient.primaryDiagnosis}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-mono pt-1 text-[#6b6b6b]">
                    <div>HR: <strong className="text-[#111]">{patient.vitals.heartRate} bpm</strong></div>
                    <div>SpO2: <strong className="text-[#111]">{patient.vitals.spo2}%</strong></div>
                    <div>Temp: <strong className="text-[#111]">{patient.vitals.temperature}°C</strong></div>
                    <div>RR: <strong className="text-[#111]">{patient.vitals.respRate} br/min</strong></div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 border-t md:border-t-0 md:border-l border-[#eae7e1] pt-6 md:pt-0 md:pl-8 shrink-0 min-w-[170px]">
                  <RiskGauge value={patient.qmlRiskScore} size="md" label="QML TB Risk" />
                  <div className="text-[11px] font-mono text-[#6b6b6b]">
                    Queue Rank: <strong className="text-[#111] font-bold">#{rank}</strong> of {PATIENTS_LIST.length}
                  </div>
                  <div className="text-[#111111] text-xs font-bold flex items-center gap-1 group-hover:text-[#4a7c6f] transition-colors">
                    Review Clinical Record <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredPatients.length === 0 && (
            <div className="text-center py-16 text-[#9a9590] bg-white border border-[#d4d0ca] rounded-2xl">
              No patients found matching your search.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
