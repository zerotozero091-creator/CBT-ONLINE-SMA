/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Settings,
  School,
  Layers,
  BookOpen,
  Calendar,
  Users,
  Database,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Save,
  Eye,
  EyeOff,
  Shield,
  Key,
  Lock,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  UserCheck,
  X,
  AlertTriangle,
  Search,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AppBrandingSettings,
  StudentClass,
  ExamActivity,
  Subject,
  Student,
  Teacher,
} from '../../types/cbt';
import { CBTStorageService, DEFAULT_SCHOOL_LOGO_URL } from '../../services/cbt-storage';
import { CBTExportService } from '../../services/export-service';
import { SupabaseSettings } from './SupabaseSettings';
import {
  SortableTh,
  SortState,
  createInitialSortState,
  toggleSortState,
  sortRows,
} from '../common/SortableTableHeader';

interface AdminDashboardProps {
  branding: AppBrandingSettings;
  onUpdateBranding: (newBranding: AppBrandingSettings) => void;
  activeSubTab?: 'branding' | 'classes' | 'activities' | 'subjects' | 'teachers' | 'students' | 'supabase';
  setActiveSubTab?: (tab: 'branding' | 'classes' | 'activities' | 'subjects' | 'teachers' | 'students' | 'supabase') => void;
}

interface DeleteModalState {
  isOpen: boolean;
  type: 'class' | 'activity' | 'subject' | 'student' | 'teacher';
  id: string;
  name: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  branding,
  onUpdateBranding,
  activeSubTab = 'branding',
  setActiveSubTab,
}) => {
  const [internalTab, setInternalTab] = useState<'branding' | 'classes' | 'activities' | 'subjects' | 'teachers' | 'students' | 'supabase'>(activeSubTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-App Confirmation Modal State (Reliable in iframes, no window.confirm)
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);

  // Sync with prop when prop changes
  useEffect(() => {
    if (activeSubTab) {
      setInternalTab(activeSubTab);
    }
  }, [activeSubTab]);

  const currentTab = setActiveSubTab ? activeSubTab : internalTab;
  const setTab = (t: 'branding' | 'classes' | 'activities' | 'subjects' | 'teachers' | 'students' | 'supabase') => {
    setInternalTab(t);
    setActiveSubTab?.(t);
  };

  // --- BRANDING STATES (Title 1, Title 2, Title 3, Logo URL) ---
  const [title1, setTitle1] = useState<string>(branding.title1);
  const [title2, setTitle2] = useState<string>(branding.title2);
  const [title3, setTitle3] = useState<string>(branding.title3);
  const [logoUrl, setLogoUrl] = useState<string>(() => CBTStorageService.resolveLogoUrl(branding.logoUrl));
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ADMIN CREDENTIALS STATES ---
  const [adminUserInput, setAdminUserInput] = useState<string>(
    () => branding.adminUsername || CBTStorageService.getAdminCredentials().username
  );
  const [adminPassInput, setAdminPassInput] = useState<string>('');
  const [adminPassConfirmInput, setAdminPassConfirmInput] = useState<string>('');
  const [showAdminNewPass, setShowAdminNewPass] = useState<boolean>(false);
  const [adminCredError, setAdminCredError] = useState<string | null>(null);

  useEffect(() => {
    setTitle1(branding.title1);
    setTitle2(branding.title2);
    setTitle3(branding.title3);
    setLogoUrl(CBTStorageService.resolveLogoUrl(branding.logoUrl));
    setAdminUserInput(branding.adminUsername || CBTStorageService.getAdminCredentials().username);
  }, [branding.title1, branding.title2, branding.title3, branding.logoUrl, branding.adminUsername]);

  // --- CLASSES STATES ---
  const [classes, setClasses] = useState<StudentClass[]>(() => CBTStorageService.getClasses());
  const [editingClass, setEditingClass] = useState<StudentClass | null>(null);
  const [classNameInput, setClassNameInput] = useState<string>('');
  const [gradeLevelInput, setGradeLevelInput] = useState<string>('Kelas XII');
  const [academicYearInput, setAcademicYearInput] = useState<string>('2025/2026');

  // --- ACTIVITIES STATES ---
  const [activities, setActivities] = useState<ExamActivity[]>(() => CBTStorageService.getActivities());
  const [editingActivity, setEditingActivity] = useState<ExamActivity | null>(null);
  const [activityCodeInput, setActivityCodeInput] = useState<string>('');
  const [activityNameInput, setActivityNameInput] = useState<string>('');
  const [activityDescInput, setActivityDescInput] = useState<string>('');

  // --- SUBJECTS STATES ---
  const [subjects, setSubjects] = useState<Subject[]>(() => CBTStorageService.getSubjects());
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectCodeInput, setSubjectCodeInput] = useState<string>('');
  const [subjectNameInput, setSubjectNameInput] = useState<string>('');
  const [subjectCategoryInput, setSubjectCategoryInput] = useState<string>('MIPA');

  // --- TEACHERS STATES ---
  const [teachers, setTeachers] = useState<Teacher[]>(() => CBTStorageService.getTeachers());
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherNipInput, setTeacherNipInput] = useState<string>('');
  const [teacherNameInput, setTeacherNameInput] = useState<string>('');
  const [teacherSubjectInput, setTeacherSubjectInput] = useState<string>(subjects[0]?.name || 'Matematika Peminatan');
  const [teacherGenderInput, setTeacherGenderInput] = useState<'Laki-laki' | 'Perempuan'>('Perempuan');
  const [teacherUsernameInput, setTeacherUsernameInput] = useState<string>('');
  const [teacherEmailInput, setTeacherEmailInput] = useState<string>('');
  const [teacherPhoneInput, setTeacherPhoneInput] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const teacherExcelInputRef = useRef<HTMLInputElement>(null);

  // --- STUDENTS STATES ---
  const [students, setStudents] = useState<Student[]>(() => CBTStorageService.getStudents());
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNisInput, setStudentNisInput] = useState<string>('');
  const [studentNisnInput, setStudentNisnInput] = useState<string>('');
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [studentGenderInput, setStudentGenderInput] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [studentClassInput, setStudentClassInput] = useState<string>(classes[0]?.name || 'XII MIPA 1');
  const [studentRoomInput, setStudentRoomInput] = useState<string>('Lab Komputer 1');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentPage, setStudentPage] = useState<number>(1);
  const STUDENTS_PER_PAGE = 50;
  const studentExcelInputRef = useRef<HTMLInputElement>(null);

  // Table sort states
  const [classSort, setClassSort] = useState<SortState>(() => createInitialSortState());
  const [activitySort, setActivitySort] = useState<SortState>(() => createInitialSortState());
  const [subjectSort, setSubjectSort] = useState<SortState>(() => createInitialSortState());
  const [teacherSort, setTeacherSort] = useState<SortState>(() => createInitialSortState());
  const [studentSort, setStudentSort] = useState<SortState>(() => createInitialSortState());

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, studentSort]);

  useEffect(() => {
    const syncClassesFromStore = () => setClasses(CBTStorageService.getClasses());
    const syncActivitiesFromStore = () => setActivities(CBTStorageService.getActivities());
    const syncSubjectsFromStore = () => setSubjects(CBTStorageService.getSubjects());
    const syncTeachersFromStore = () => setTeachers(CBTStorageService.getTeachers());
    const syncStudentsFromStore = () => setStudents(CBTStorageService.getStudents());
    const syncAllFromStore = () => {
      syncClassesFromStore();
      syncActivitiesFromStore();
      syncSubjectsFromStore();
      syncTeachersFromStore();
      syncStudentsFromStore();
    };

    window.addEventListener('cbt-classes-change', syncClassesFromStore);
    window.addEventListener('cbt-activities-change', syncActivitiesFromStore);
    window.addEventListener('cbt-subjects-change', syncSubjectsFromStore);
    window.addEventListener('cbt-teachers-change', syncTeachersFromStore);
    window.addEventListener('cbt-students-change', syncStudentsFromStore);
    window.addEventListener('storage', syncAllFromStore);
    return () => {
      window.removeEventListener('cbt-classes-change', syncClassesFromStore);
      window.removeEventListener('cbt-activities-change', syncActivitiesFromStore);
      window.removeEventListener('cbt-subjects-change', syncSubjectsFromStore);
      window.removeEventListener('cbt-teachers-change', syncTeachersFromStore);
      window.removeEventListener('cbt-students-change', syncStudentsFromStore);
      window.removeEventListener('storage', syncAllFromStore);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- IN-APP CONFIRMATION DELETE HANDLER ---
  const handleConfirmDelete = () => {
    if (!deleteModal) return;
    const { type, id, name } = deleteModal;

    if (type === 'class') {
      CBTStorageService.deleteClass(id);
      setClasses(CBTStorageService.getClasses());
      showToast(`Kelas "${name}" berhasil dihapus.`);
    } else if (type === 'activity') {
      CBTStorageService.deleteActivity(id);
      setActivities(CBTStorageService.getActivities());
      showToast(`Aktivitas "${name}" berhasil dihapus.`);
    } else if (type === 'subject') {
      CBTStorageService.deleteSubject(id);
      setSubjects(CBTStorageService.getSubjects());
      showToast(`Mata pelajaran "${name}" berhasil dihapus.`);
    } else if (type === 'student') {
      CBTStorageService.deleteStudent(id);
      setStudents(CBTStorageService.getStudents());
      showToast(`Data siswa "${name}" berhasil dihapus.`);
    } else if (type === 'teacher') {
      CBTStorageService.deleteTeacher(id);
      setTeachers(CBTStorageService.getTeachers());
      showToast(`Data guru "${name}" berhasil dihapus.`);
    }

    setDeleteModal(null);
  };

  // --- LOGO FILE UPLOAD HANDLER ---
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    const validExtensions = /\.(png|jpe?g|svg|webp)$/i;

    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      setUploadError('Tipe file tidak didukung. Harap unggah file dengan format .PNG, .JPG, .JPEG, .SVG, atau .WEBP.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Ukuran file terlalu besar. Maksimal ukuran logo adalah 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
        setLogoFileName(file.name);
        showToast(`Logo ${file.name} berhasil dimuat! Klik 'Simpan Pengaturan' untuk menerapkan.`);
      }
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file gambar. Silakan coba kembali.');
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = () => {
    setLogoUrl(DEFAULT_SCHOOL_LOGO_URL);
    setLogoFileName('');
    setUploadError(null);
    showToast('Logo dikembalikan ke lambang standar sekolah.');
  };

  // --- SAVE BRANDING ---
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppBrandingSettings = {
      ...branding,
      title1: title1.trim(),
      title2: title2.trim(),
      title3: title3.trim(),
      logoUrl: logoUrl.trim(),
    };
    CBTStorageService.saveBranding(updated);
    onUpdateBranding(updated);
    showToast('Judul Aplikasi (Title 1, 2, 3) dan Logo Sekolah berhasil diperbarui!');
  };

  // --- SAVE ADMIN CREDENTIALS ---
  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCredError(null);

    const nextUser = adminUserInput.trim();
    if (nextUser.length < 3) {
      setAdminCredError('Username Admin minimal terdiri dari 3 karakter.');
      return;
    }
    if (/\s/.test(nextUser)) {
      setAdminCredError('Username Admin tidak boleh mengandung spasi.');
      return;
    }

    const currentCreds = CBTStorageService.getAdminCredentials();
    let nextPass = currentCreds.password;

    if (adminPassInput.length > 0 || adminPassConfirmInput.length > 0) {
      if (adminPassInput.length < 4) {
        setAdminCredError('Password Admin baru minimal terdiri dari 4 karakter.');
        return;
      }
      if (adminPassInput !== adminPassConfirmInput) {
        setAdminCredError('Konfirmasi password Admin tidak sama.');
        return;
      }
      nextPass = adminPassInput;
    }

    const updated = CBTStorageService.updateAdminCredentials(nextUser, nextPass);
    onUpdateBranding(updated);
    setAdminPassInput('');
    setAdminPassConfirmInput('');
    showToast(
      adminPassInput.length > 0
        ? `Username (${nextUser}) & Password Login Admin berhasil diperbarui!`
        : `Username Login Admin (${nextUser}) berhasil diperbarui!`
    );
  };

  // --- CLASS CRUD HANDLERS ---
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    const newClass: StudentClass = {
      id: editingClass ? editingClass.id : `cls-${Date.now()}`,
      name: classNameInput.trim(),
      gradeLevel: gradeLevelInput,
      academicYear: academicYearInput,
    };

    CBTStorageService.saveClass(newClass);
    setClasses(CBTStorageService.getClasses());
    setEditingClass(null);
    setClassNameInput('');
    showToast(`Kelas ${newClass.name} berhasil disimpan.`);
  };

  const handleEditClass = (cls: StudentClass) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setGradeLevelInput(cls.gradeLevel);
    setAcademicYearInput(cls.academicYear);
  };

  // --- ACTIVITY CRUD HANDLERS ---
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityNameInput.trim()) return;

    const newAct: ExamActivity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}`,
      code: activityCodeInput.trim().toUpperCase() || 'UJIAN',
      name: activityNameInput.trim(),
      description: activityDescInput.trim(),
    };

    CBTStorageService.saveActivity(newAct);
    setActivities(CBTStorageService.getActivities());
    setEditingActivity(null);
    setActivityCodeInput('');
    setActivityNameInput('');
    setActivityDescInput('');
    showToast(`Aktivitas ujian ${newAct.name} berhasil disimpan.`);
  };

  const handleEditActivity = (act: ExamActivity) => {
    setEditingActivity(act);
    setActivityCodeInput(act.code);
    setActivityNameInput(act.name);
    setActivityDescInput(act.description || '');
  };

  // --- SUBJECT CRUD HANDLERS ---
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim()) return;

    const newSubj: Subject = {
      id: editingSubject ? editingSubject.id : `sbj-${Date.now()}`,
      code: subjectCodeInput.trim().toUpperCase() || 'MAPEL',
      name: subjectNameInput.trim(),
      category: subjectCategoryInput,
    };

    CBTStorageService.saveSubject(newSubj);
    setSubjects(CBTStorageService.getSubjects());
    setEditingSubject(null);
    setSubjectCodeInput('');
    setSubjectNameInput('');
    showToast(`Mata pelajaran ${newSubj.name} berhasil disimpan.`);
  };

  const handleEditSubject = (sbj: Subject) => {
    setEditingSubject(sbj);
    setSubjectCodeInput(sbj.code);
    setSubjectNameInput(sbj.name);
    setSubjectCategoryInput(sbj.category || 'MIPA');
  };

  // --- TEACHER CRUD & EXCEL IMPORT ---
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherNameInput.trim()) return;

    const newTch: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch-${Date.now()}`,
      nip: teacherNipInput.trim() || `198${Date.now().toString().slice(-8)}`,
      name: teacherNameInput.trim(),
      subject: teacherSubjectInput.trim(),
      gender: teacherGenderInput,
      username: teacherUsernameInput.trim() || 'guru',
      email: teacherEmailInput.trim() || undefined,
      phone: teacherPhoneInput.trim() || undefined,
    };

    CBTStorageService.saveTeacher(newTch);
    setTeachers(CBTStorageService.getTeachers());
    setEditingTeacher(null);
    setTeacherNipInput('');
    setTeacherNameInput('');
    setTeacherUsernameInput('');
    setTeacherEmailInput('');
    setTeacherPhoneInput('');
    showToast(`Data guru ${newTch.name} berhasil disimpan.`);
  };

  const handleEditTeacher = (tch: Teacher) => {
    setEditingTeacher(tch);
    setTeacherNipInput(tch.nip);
    setTeacherNameInput(tch.name);
    setTeacherSubjectInput(tch.subject);
    setTeacherGenderInput(tch.gender);
    setTeacherUsernameInput(tch.username);
    setTeacherEmailInput(tch.email || '');
    setTeacherPhoneInput(tch.phone || '');
  };

  const handleExcelTeacherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          showToast('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const parsedTeachers: Teacher[] = json.map((row, idx) => {
          const nip = row['nip'] || row['NIP'] || row['Nuptk'] || `1985${1000 + idx}`;
          const name = row['name'] || row['Name'] || row['Nama'] || row['Nama Lengkap'] || `Guru Pengampu ${idx + 1}`;
          const subject = row['subject'] || row['Subject'] || row['Mata Pelajaran'] || row['Mapel'] || 'Matematika Peminatan';
          const rawGender = String(row['gender'] || row['Gender'] || row['Jenis Kelamin'] || row['JK'] || 'Perempuan');
          const gender: 'Laki-laki' | 'Perempuan' = (rawGender.toLowerCase().startsWith('l') || rawGender.toLowerCase().includes('laki')) ? 'Laki-laki' : 'Perempuan';
          const username = row['username'] || row['Username'] || `guru${idx + 1}`;
          const email = row['email'] || row['Email'] || undefined;
          const phone = row['phone'] || row['Phone'] || row['No HP'] || undefined;

          return {
            id: `tch-excel-${Date.now()}-${idx}`,
            nip: String(nip).trim(),
            name: String(name).trim(),
            subject: String(subject).trim(),
            gender,
            username: String(username).trim(),
            email: email ? String(email).trim() : undefined,
            phone: phone ? String(phone).trim() : undefined,
          };
        });

        const count = CBTStorageService.importTeachers(parsedTeachers);
        setTeachers(CBTStorageService.getTeachers());
        showToast(`Sukses! ${count} data guru berhasil diimpor dari file Excel.`);
      } catch {
        showToast('Gagal memproses file Excel guru. Pastikan file berformat .xlsx / .xls valid.');
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- STUDENT CRUD & EXCEL IMPORT ---
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNisInput.trim() || !studentNameInput.trim()) return;

    const newStd: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}`,
      nis: studentNisInput.trim(),
      nisn: studentNisnInput.trim() || `008${studentNisInput.trim()}`,
      name: studentNameInput.trim(),
      gender: studentGenderInput,
      className: studentClassInput,
      room: studentRoomInput.trim() || 'Lab Komputer 1',
    };

    CBTStorageService.saveStudent(newStd);
    setStudents(CBTStorageService.getStudents());
    setEditingStudent(null);
    setStudentNisInput('');
    setStudentNisnInput('');
    setStudentNameInput('');
    showToast(`Data siswa ${newStd.name} berhasil disimpan.`);
  };

  const handleEditStudent = (std: Student) => {
    setEditingStudent(std);
    setStudentNisInput(std.nis);
    setStudentNisnInput(std.nisn);
    setStudentNameInput(std.name);
    setStudentGenderInput(std.gender);
    setStudentClassInput(std.className);
    setStudentRoomInput(std.room);
  };

  const handleExcelStudentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          showToast('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const parsedStudents: Student[] = json.map((rawRow, idx) => {
          const row: Record<string, any> = {};
          Object.keys(rawRow || {}).forEach((k) => {
            row[k.trim().toLowerCase()] = rawRow[k];
          });
          const nis = row['nis'] ?? row['nomor induk'] ?? row['no induk'] ?? row['no. induk'] ?? row['nis siswa'] ?? `2024${1010 + idx}`;
          const nisnRaw = row['nisn'];
          const nisn = nisnRaw !== undefined && String(nisnRaw).trim() !== '' && String(nisnRaw).trim() !== '-' ? nisnRaw : `008${String(nis).trim()}`;
          const name = row['name'] ?? row['nama'] ?? row['nama lengkap'] ?? row['nama siswa'] ?? `Siswa Baru ${idx + 1}`;
          const rawGender = String(row['gender'] ?? row['jenis kelamin'] ?? row['jk'] ?? 'Laki-laki');
          const gender: 'Laki-laki' | 'Perempuan' = (rawGender.toLowerCase().startsWith('p') || rawGender.toLowerCase().includes('perempuan')) ? 'Perempuan' : 'Laki-laki';
          const className = row['classname'] ?? row['kelas'] ?? row['rombel'] ?? 'XII MIPA 1';
          const room = row['room'] ?? row['ruang'] ?? row['ruang ujian'] ?? 'Lab Komputer 1';

          return {
            id: `std-excel-${Date.now()}-${idx}`,
            nis: String(nis).trim(),
            nisn: String(nisn).trim(),
            name: String(name).trim(),
            gender,
            className: String(className).trim(),
            room: String(room).trim(),
          };
        });

        const count = CBTStorageService.importStudents(parsedStudents);
        setStudents(CBTStorageService.getStudents());
        showToast(`Sukses! ${count} data siswa berhasil diimpor dari file Excel.`);
      } catch {
        showToast('Gagal memproses file Excel siswa. Pastikan format tabel sesuai.');
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtered lists for search (memoized for 850+ students)
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.nip.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  const sortedClasses = sortRows(classes, classSort, {
    name: (c) => c.name,
    gradeLevel: (c) => c.gradeLevel,
    academicYear: (c) => c.academicYear,
  });

  const sortedActivities = sortRows(activities, activitySort, {
    code: (a) => a.code,
    name: (a) => a.name,
    description: (a) => a.description || '',
  });

  const sortedSubjects = sortRows(subjects, subjectSort, {
    code: (s) => s.code,
    name: (s) => s.name,
    category: (s) => s.category || '',
  });

  const sortedTeachers = sortRows(filteredTeachers, teacherSort, {
    nip: (t) => t.nip,
    name: (t) => t.name,
    subject: (t) => t.subject,
    username: (t) => t.username || '',
  });

  const sortedStudents = useMemo(
    () =>
      sortRows(filteredStudents, studentSort, {
        nis: (s) => s.nis,
        name: (s) => s.name,
        gender: (s) => s.gender,
        className: (s) => s.className,
        room: (s) => s.room,
      }),
    [filteredStudents, studentSort]
  );

  const totalStudentPages = Math.max(1, Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE));
  const safeStudentPage = Math.min(studentPage, totalStudentPages);
  const paginatedStudents = useMemo(() => {
    const start = (safeStudentPage - 1) * STUDENTS_PER_PAGE;
    return sortedStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [sortedStudents, safeStudentPage]);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-bold uppercase tracking-wider">
            Role: Administrator
          </span>
          <span className="text-xs text-slate-500">· Kendali Penuh Pengaturan & Basis Data</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Panel Administrator CBT
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola logo sekolah, judul aplikasi, kelas siswa, aktivitas ujian, mata pelajaran, master guru, dan master siswa.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Internal Subtabs for mobile & quick switching */}
      <div className="flex md:hidden flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('branding')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
            currentTab === 'branding' ? 'bg-teal-700 text-white' : 'text-slate-600'
          }`}
        >
          Setting & Logo
        </button>
        <button
          onClick={() => setTab('classes')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
            currentTab === 'classes' ? 'bg-teal-700 text-white' : 'text-slate-600'
          }`}
        >
          Kelas
        </button>
        <button
          onClick={() => setTab('activities')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
            currentTab === 'activities' ? 'bg-teal-700 text-white' : 'text-slate-600'
          }`}
        >
          Aktivitas
        </button>
        <button
          onClick={() => setTab('subjects')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
            currentTab === 'subjects' ? 'bg-teal-700 text-white' : 'text-slate-600'
          }`}
        >
          Mapel
        </button>
        <button
          onClick={() => setTab('teachers')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
            currentTab === 'teachers' ? 'bg-teal-700 text-white' : 'text-slate-600'
          }`}
        >
          Master Guru
        </button>
        <button
          onClick={() => setTab('students')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
            currentTab === 'students' ? 'bg-teal-700 text-white' : 'text-slate-600'
          }`}
        >
          Master Siswa
        </button>
      </div>

      {/* TAB 1: SETTING & UPLOAD LOGO SEKOLAH */}
      {currentTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveBranding} className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Logo Sekolah & Pengaturan Judul Aplikasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi identitas resmi lembaga pendidikan untuk kop lembar ujian, sidebar, dan header.
              </p>
            </div>

            {/* UPLOAD LOGO SEKOLAH */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  Logo Resmi Sekolah / Madrasah:
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Maks. 3 MB
                </span>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                  <img
                    src={CBTStorageService.resolveLogoUrl(logoUrl)}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_SCHOOL_LOGO_URL;
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Bawaan</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mendukung format: <strong className="text-slate-700 dark:text-slate-300 font-mono">PNG, JPG, JPEG, SVG, WEBP</strong>.
                    {logoFileName && (
                      <span className="block text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        File terpilih: {logoFileName}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* TITLE 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul 1 (Title 1) - Lembaga Induk / Kementerian / Dinas:
              </label>
              <input
                type="text"
                value={title1}
                onChange={(e) => setTitle1(e.target.value)}
                placeholder="Contoh: KEMENTERIAN AGAMA REPUBLIK INDONESIA"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* TITLE 2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul 2 (Title 2) - Nama Sekolah / Madrasah:
              </label>
              <input
                type="text"
                value={title2}
                onChange={(e) => setTitle2(e.target.value)}
                placeholder="Contoh: MAN 1 INSAN CENDEKIA NUSANTARA"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* TITLE 3 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul 3 (Title 3) - Subjudul Aplikasi / Jenis Asesmen:
              </label>
              <input
                type="text"
                value={title3}
                onChange={(e) => setTitle3(e.target.value)}
                placeholder="Contoh: SISTEM CBT ONLINE & ASESMEN DIGITAL MANDIRI"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Dashboard & Logo</span>
              </button>
            </div>
          </form>

          {/* Live Preview & Admin Credentials Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <Eye className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pratinjau Langsung (Live Header Preview)
                </h3>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 mx-auto mb-3 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center overflow-hidden">
                  <img
                    src={CBTStorageService.resolveLogoUrl(logoUrl)}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_SCHOOL_LOGO_URL;
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  {title1 || 'JUDUL 1 (LEMBAGA INDUK)'}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {title2 || 'JUDUL 2 (NAMA SEKOLAH/MADRASAH)'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {title3 || 'JUDUL 3 (SUBJUDUL APLIKASI CBT)'}
                </div>
              </div>
            </div>

            {/* ADMIN ACCOUNT SECURITY CARD */}
            <form
              onSubmit={handleSaveAdminCredentials}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Keamanan Akun Administrator
                  </h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Login Admin
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah username dan password yang digunakan pada tab <strong>Admin</strong> di halaman login.
              </p>

              {adminCredError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminCredError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username Administrator:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminUserInput}
                    onChange={(e) => {
                      setAdminUserInput(e.target.value);
                      setAdminCredError(null);
                    }}
                    placeholder="Minimal 3 karakter, tanpa spasi"
                    className="w-full text-xs sm:text-sm pl-3.5 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password Baru <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>:
                </label>
                <div className="relative">
                  <input
                    type={showAdminNewPass ? 'text' : 'password'}
                    value={adminPassInput}
                    onChange={(e) => {
                      setAdminPassInput(e.target.value);
                      setAdminCredError(null);
                    }}
                    placeholder="Minimal 4 karakter"
                    className="w-full text-xs sm:text-sm pl-3.5 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                    className="absolute right-2.5 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showAdminNewPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showAdminNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Konfirmasi Password Baru:
                </label>
                <div className="relative">
                  <input
                    type={showAdminNewPass ? 'text' : 'password'}
                    value={adminPassConfirmInput}
                    onChange={(e) => {
                      setAdminPassConfirmInput(e.target.value);
                      setAdminCredError(null);
                    }}
                    placeholder="Ulangi password baru"
                    className="w-full text-xs sm:text-sm pl-3.5 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Username & Password Admin</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA KELAS SISWA */}
      {currentTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveClass} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingClass ? 'Edit Data Kelas' : 'Input Kelas Baru'}
              </h2>
              {editingClass && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingClass(null);
                    setClassNameInput('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Batal
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Kelas:
              </label>
              <input
                type="text"
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                placeholder="Contoh: XII MIPA 1 atau X-A"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Jenjang:
              </label>
              <select
                value={gradeLevelInput}
                onChange={(e) => setGradeLevelInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Kelas X">Kelas X</option>
                <option value="Kelas XI">Kelas XI</option>
                <option value="Kelas XII">Kelas XII</option>
                <option value="Kelas VII">Kelas VII (MTs/SMP)</option>
                <option value="Kelas VIII">Kelas VIII (MTs/SMP)</option>
                <option value="Kelas IX">Kelas IX (MTs/SMP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Pelajaran:
              </label>
              <input
                type="text"
                value={academicYearInput}
                onChange={(e) => setAcademicYearInput(e.target.value)}
                placeholder="2025/2026"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingClass ? 'Perbarui Kelas' : 'Simpan Kelas Baru'}</span>
            </button>
          </form>

          {/* Classes Table */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Kelas Siswa Terdaftar
              </h3>
              <span className="text-xs text-slate-500 font-mono">Total: {classes.length} Kelas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <SortableTh
                      label="Nama Kelas"
                      sortKey="name"
                      sortState={classSort}
                      onSort={(key) => setClassSort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <SortableTh
                      label="Jenjang"
                      sortKey="gradeLevel"
                      sortState={classSort}
                      onSort={(key) => setClassSort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <SortableTh
                      label="Tahun Pelajaran"
                      sortKey="academicYear"
                      sortState={classSort}
                      onSort={(key) => setClassSort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedClasses.map((cls, idx) => (
                    <tr key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cls.name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{cls.gradeLevel}</td>
                      <td className="py-3 px-4 text-slate-500">{cls.academicYear}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClass(cls)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Kelas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, type: 'class', id: cls.id, name: cls.name })}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA AKTIVITAS UJIAN */}
      {currentTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveActivity} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingActivity ? 'Edit Aktivitas Ujian' : 'Input Aktivitas Ujian'}
              </h2>
              {editingActivity && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingActivity(null);
                    setActivityCodeInput('');
                    setActivityNameInput('');
                    setActivityDescInput('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Batal
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Singkat Aktivitas:
              </label>
              <input
                type="text"
                value={activityCodeInput}
                onChange={(e) => setActivityCodeInput(e.target.value.toUpperCase())}
                placeholder="Contoh: ASAJ, PTS, PAS, UM, ANBK"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 uppercase font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Aktivitas:
              </label>
              <input
                type="text"
                value={activityNameInput}
                onChange={(e) => setActivityNameInput(e.target.value)}
                placeholder="Contoh: Asesmen Sumatif Akhir Jenjang (ASAJ)"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan / Deskripsi:
              </label>
              <textarea
                rows={3}
                value={activityDescInput}
                onChange={(e) => setActivityDescInput(e.target.value)}
                placeholder="Penjelasan jadwal atau tujuan pelaksanaan ujian..."
                className="w-full text-xs px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingActivity ? 'Perbarui Aktivitas' : 'Simpan Aktivitas'}</span>
            </button>
          </form>

          {/* Activities Table */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Aktivitas Ujian Sekolah / Madrasah
              </h3>
              <span className="text-xs text-slate-500 font-mono">Total: {activities.length} Aktivitas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <SortableTh
                      label="Kode"
                      sortKey="code"
                      sortState={activitySort}
                      onSort={(key) => setActivitySort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <SortableTh
                      label="Nama Aktivitas Ujian"
                      sortKey="name"
                      sortState={activitySort}
                      onSort={(key) => setActivitySort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <SortableTh
                      label="Deskripsi"
                      sortKey="description"
                      sortState={activitySort}
                      onSort={(key) => setActivitySort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                          {act.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{act.name}</td>
                      <td className="py-3 px-4 text-slate-500">{act.description || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditActivity(act)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Aktivitas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, type: 'activity', id: act.id, name: act.name })}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                            title="Hapus Aktivitas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA MATA PELAJARAN */}
      {currentTab === 'subjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form onSubmit={handleSaveSubject} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Edit Mata Pelajaran' : 'Input Mata Pelajaran'}
              </h2>
              {editingSubject && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubject(null);
                    setSubjectCodeInput('');
                    setSubjectNameInput('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Batal
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kode Mapel:
              </label>
              <input
                type="text"
                value={subjectCodeInput}
                onChange={(e) => setSubjectCodeInput(e.target.value.toUpperCase())}
                placeholder="Contoh: MAT, FIS, KIM, BIO, BING"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 uppercase font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Mata Pelajaran:
              </label>
              <input
                type="text"
                value={subjectNameInput}
                onChange={(e) => setSubjectNameInput(e.target.value)}
                placeholder="Contoh: Matematika Peminatan"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori / Kelompok:
              </label>
              <select
                value={subjectCategoryInput}
                onChange={(e) => setSubjectCategoryInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="MIPA">MIPA (Sains & Matematika)</option>
                <option value="IPS">IPS (Sosial & Humaniora)</option>
                <option value="Umum">Umum (Wajib Nasional)</option>
                <option value="Keagamaan">Keagamaan / PAI</option>
                <option value="Bahasa">Bahasa & Sastra</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingSubject ? 'Perbarui Mapel' : 'Simpan Mapel'}</span>
            </button>
          </form>

          {/* Subjects Table */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Mata Pelajaran
              </h3>
              <span className="text-xs text-slate-500 font-mono">Total: {subjects.length} Mapel</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <SortableTh
                      label="Kode"
                      sortKey="code"
                      sortState={subjectSort}
                      onSort={(key) => setSubjectSort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <SortableTh
                      label="Nama Mata Pelajaran"
                      sortKey="name"
                      sortState={subjectSort}
                      onSort={(key) => setSubjectSort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <SortableTh
                      label="Kategori"
                      sortKey="category"
                      sortState={subjectSort}
                      onSort={(key) => setSubjectSort(prev => toggleSortState(prev, key))}
                      className="py-3 px-4"
                    />
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedSubjects.map((sbj) => (
                    <tr key={sbj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {sbj.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{sbj.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          {sbj.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditSubject(sbj)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Mapel"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, type: 'subject', id: sbj.id, name: sbj.name })}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                            title="Hapus Mapel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MASTER GURU (UNDUH TEMPLATE, UNGGAH EXCEL, EDIT, HAPUS) */}
      {currentTab === 'teachers' && (
        <div className="space-y-6">
          {/* Action Toolbar: Unduh Template & Unggah Excel */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Pengelolaan Data Master Guru
                </h3>
                <p className="text-[11px] text-slate-500">
                  Unduh template format Excel, unggah berkas massal, tambah, edit, atau hapus guru pengampu.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => CBTExportService.downloadTeacherTemplate()}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Unduh Template Guru (.xlsx)</span>
              </button>

              <input
                ref={teacherExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelTeacherUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => teacherExcelInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Excel Guru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Input / Edit Guru */}
            <form onSubmit={handleSaveTeacher} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Pengampu'}
                </h2>
                {editingTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacher(null);
                      setTeacherNipInput('');
                      setTeacherNameInput('');
                      setTeacherUsernameInput('');
                      setTeacherEmailInput('');
                      setTeacherPhoneInput('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Batal
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIP / NUPTK:
                </label>
                <input
                  type="text"
                  value={teacherNipInput}
                  onChange={(e) => setTeacherNipInput(e.target.value)}
                  placeholder="Contoh: 198503152010011002"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar:
                </label>
                <input
                  type="text"
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  placeholder="Contoh: Dra. Hj. Siti Rahmawati, M.Pd."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran Diampu:
                </label>
                <select
                  value={teacherSubjectInput}
                  onChange={(e) => setTeacherSubjectInput(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Kelamin:
                </label>
                <select
                  value={teacherGenderInput}
                  onChange={(e) => setTeacherGenderInput(e.target.value as any)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Perempuan">Perempuan</option>
                  <option value="Laki-laki">Laki-laki</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username Login CBT:
                </label>
                <input
                  type="text"
                  value={teacherUsernameInput}
                  onChange={(e) => setTeacherUsernameInput(e.target.value)}
                  placeholder="Contoh: guru atau srahmawati"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email (Opsional):
                </label>
                <input
                  type="email"
                  value={teacherEmailInput}
                  onChange={(e) => setTeacherEmailInput(e.target.value)}
                  placeholder="email@sekolah.sch.id"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingTeacher ? 'Perbarui Data Guru' : 'Simpan Data Guru'}</span>
              </button>
            </form>

            {/* Table Daftar Guru */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Daftar Guru Pengampu
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Total: {teachers.length} Guru</span>
                </div>

                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Cari guru / mapel..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <SortableTh
                        label="NIP"
                        sortKey="nip"
                        sortState={teacherSort}
                        onSort={(key) => setTeacherSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Nama Lengkap"
                        sortKey="name"
                        sortState={teacherSort}
                        onSort={(key) => setTeacherSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Mata Pelajaran"
                        sortKey="subject"
                        sortState={teacherSort}
                        onSort={(key) => setTeacherSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Username"
                        sortKey="username"
                        sortState={teacherSort}
                        onSort={(key) => setTeacherSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedTeachers.map((tch) => (
                      <tr key={tch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-300">
                          {tch.nip}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {tch.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {tch.subject}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {tch.username}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditTeacher(tch)}
                              className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Guru"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, type: 'teacher', id: tch.id, name: tch.name })}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                              title="Hapus Guru"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sortedTeachers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada data guru yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MASTER SISWA & NIS (UNDUH TEMPLATE, UNGGAH EXCEL, EDIT, HAPUS) */}
      {currentTab === 'students' && (
        <div className="space-y-6">
          {/* Action Toolbar: Unduh Template & Unggah Excel */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Pengelolaan Data Master Siswa & NIS
                </h3>
                <p className="text-[11px] text-slate-500">
                  Unduh template Excel dengan nama kolom basis data resmi, unggah data siswa massal, edit, dan hapus.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => CBTExportService.downloadStudentTemplate()}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Unduh Template Siswa (.xlsx)</span>
              </button>

              <input
                ref={studentExcelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelStudentUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => studentExcelInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Excel Siswa</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Input / Edit Siswa */}
            <form onSubmit={handleSaveStudent} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                </h2>
                {editingStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setStudentNisInput('');
                      setStudentNisnInput('');
                      setStudentNameInput('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Batal
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Induk Siswa (NIS) - Kunci Login:
                </label>
                <input
                  type="text"
                  value={studentNisInput}
                  onChange={(e) => setStudentNisInput(e.target.value)}
                  placeholder="Contoh: 20241011"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NISN (Opsional):
                </label>
                <input
                  type="text"
                  value={studentNisnInput}
                  onChange={(e) => setStudentNisnInput(e.target.value)}
                  placeholder="Contoh: 0067829111"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="Nama sesuai kartu peserta"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Kelamin:
                </label>
                <select
                  value={studentGenderInput}
                  onChange={(e) => setStudentGenderInput(e.target.value as any)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas:
                </label>
                <select
                  value={studentClassInput}
                  onChange={(e) => setStudentClassInput(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ruang Asesmen:
                </label>
                <input
                  type="text"
                  value={studentRoomInput}
                  onChange={(e) => setStudentRoomInput(e.target.value)}
                  placeholder="Contoh: Lab Komputer 1"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingStudent ? 'Perbarui Siswa' : 'Simpan Siswa'}</span>
              </button>
            </form>

            {/* Students Table */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Basis Data Siswa Terdaftar
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Total: {students.length} Siswa</span>
                </div>

                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari NIS / Nama siswa..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <SortableTh
                        label="NIS"
                        sortKey="nis"
                        sortState={studentSort}
                        onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Nama Lengkap"
                        sortKey="name"
                        sortState={studentSort}
                        onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Gender"
                        sortKey="gender"
                        sortState={studentSort}
                        onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Kelas"
                        sortKey="className"
                        sortState={studentSort}
                        onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <SortableTh
                        label="Ruang"
                        sortKey="room"
                        sortState={studentSort}
                        onSort={(key) => setStudentSort(prev => toggleSortState(prev, key))}
                        className="py-3 px-4"
                      />
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.map((std) => (
                      <tr key={std.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-teal-700 dark:text-teal-300">
                          {std.nis}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {std.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {std.gender}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {std.className}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {std.room}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditStudent(std)}
                              className="p-1.5 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Siswa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, type: 'student', id: std.id, name: std.name })}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Tidak ada siswa yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {sortedStudents.length > STUDENTS_PER_PAGE && (
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>
                    Menampilkan {(safeStudentPage - 1) * STUDENTS_PER_PAGE + 1}–
                    {Math.min(safeStudentPage * STUDENTS_PER_PAGE, sortedStudents.length)} dari{' '}
                    <strong>{sortedStudents.length}</strong> siswa
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeStudentPage <= 1}
                      onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    >
                      Sebelumnya
                    </button>
                    <span className="px-2 font-mono">
                      Hal {safeStudentPage} / {totalStudentPages}
                    </span>
                    <button
                      type="button"
                      disabled={safeStudentPage >= totalStudentPages}
                      onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUPABASE POSTGRESQL & NEXT.JS BLUEPRINT */}
      {currentTab === 'supabase' && (
        <SupabaseSettings />
      )}

      {/* IN-APP CONFIRMATION DELETE DIALOG (GUARANTEED EXECUTION IN IFRAMES) */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Hapus Data
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>"{deleteModal.name}"</strong>? Data yang dihapus tidak dapat dipulihkan kembali.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
