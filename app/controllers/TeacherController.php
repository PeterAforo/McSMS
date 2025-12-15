<?php
/**
 * Teacher Controller
 * Handles teacher portal functionality
 */

class TeacherController extends Controller {
    
    public function __construct() {
        $this->requireRole('teacher');
    }
    
    /**
     * Teacher Dashboard
     */
    public function dashboard() {
        $teacherId = Auth::id();
        
        $stats = [
            'my_classes' => $this->getTeacherClassCount($teacherId),
            'total_students' => $this->getTeacherStudentCount($teacherId),
            'pending_grading' => 0, // TODO: Implement
            'homework_assigned' => 0 // TODO: Implement
        ];
        
        $this->render('teacher/dashboard', [
            'pageTitle' => 'Teacher Dashboard - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getTeacherSidebar(),
            'stats' => $stats
        ]);
    }
    
    /**
     * My Classes
     */
    public function myClasses() {
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $this->render('teacher/my_classes', [
            'pageTitle' => 'My Classes - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getTeacherSidebar(),
            'classes' => $classes
        ]);
    }
    
    /**
     * Take Attendance
     */
    public function attendance() {
        $classId = $_GET['class_id'] ?? null;
        $sectionId = $_GET['section_id'] ?? null;
        $date = $_GET['date'] ?? date('Y-m-d');
        
        if (!$classId) {
            Session::setFlash('error', 'Please select a class.', 'error');
            $this->redirect('teacher', 'myClasses');
        }
        
        $studentModel = new Student();
        $students = $studentModel->getByClass($classId, $sectionId);
        
        $classModel = new ClassModel();
        $class = $classModel->getWithSections($classId);
        
        // Get existing attendance for the date
        $attendanceModel = new Attendance();
        $existingAttendance = $attendanceModel->getByClassAndDate($classId, $date);
        
        $this->render('teacher/attendance_form', [
            'pageTitle' => 'Take Attendance - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getTeacherSidebar(),
            'students' => $students,
            'class' => $class,
            'date' => $date,
            'existingAttendance' => $existingAttendance
        ]);
    }
    
    /**
     * Store Attendance
     */
    public function storeAttendance() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('teacher', 'myClasses');
        }
        
        $date = $_POST['date'] ?? date('Y-m-d');
        $attendance = $_POST['attendance'] ?? [];
        
        if (empty($attendance)) {
            Session::setFlash('error', 'No attendance data submitted.', 'error');
            $this->redirect('teacher', 'myClasses');
        }
        
        $attendanceModel = new Attendance();
        $teacherId = Auth::id();
        
        try {
            foreach ($attendance as $studentId => $status) {
                $attendanceModel->markAttendance($studentId, $date, $status, $teacherId);
            }
            
            Session::setFlash('success', 'Attendance recorded successfully!', 'success');
            $this->redirect('teacher', 'myClasses');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to record attendance.', 'error');
            $this->redirect('teacher', 'myClasses');
        }
    }
    
    /**
     * Grade Entry
     */
    public function grades() {
        $classId = $_GET['class_id'] ?? null;
        $subjectId = $_GET['subject_id'] ?? null;
        $termId = $_GET['term_id'] ?? 1;
        
        if (!$classId || !$subjectId) {
            Session::setFlash('error', 'Please select class and subject.', 'error');
            $this->redirect('teacher', 'myClasses');
        }
        
        $studentModel = new Student();
        $students = $studentModel->getByClass($classId);
        
        $resultModel = new Result();
        $existingResults = $resultModel->getByClassSubjectTerm($classId, $subjectId, $termId);
        
        $this->render('teacher/results_form', [
            'pageTitle' => 'Enter Grades - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getTeacherSidebar(),
            'students' => $students,
            'classId' => $classId,
            'subjectId' => $subjectId,
            'termId' => $termId,
            'existingResults' => $existingResults
        ]);
    }
    
    /**
     * Store Grades
     */
    public function storeGrades() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('teacher', 'myClasses');
        }
        
        $subjectId = $_POST['subject_id'] ?? null;
        $termId = $_POST['term_id'] ?? null;
        $grades = $_POST['grades'] ?? [];
        
        if (empty($grades)) {
            Session::setFlash('error', 'No grades submitted.', 'error');
            $this->redirect('teacher', 'myClasses');
        }
        
        $resultModel = new Result();
        
        try {
            foreach ($grades as $studentId => $scores) {
                $caScore = floatval($scores['ca_score'] ?? 0);
                $examScore = floatval($scores['exam_score'] ?? 0);
                $total = $caScore + $examScore;
                $grade = $this->calculateGrade($total);
                
                $resultModel->saveResult($studentId, $subjectId, $termId, $caScore, $examScore, $total, $grade);
            }
            
            Session::setFlash('success', 'Grades saved successfully!', 'success');
            $this->redirect('teacher', 'myClasses');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save grades.', 'error');
            $this->redirect('teacher', 'myClasses');
        }
    }
    
    /**
     * Homework List
     */
    public function homework() {
        $homeworkModel = new Homework();
        $teacherId = Auth::id();
        $homeworkList = $homeworkModel->getByTeacher($teacherId);
        
        $this->render('teacher/homework_list', [
            'pageTitle' => 'Homework - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getTeacherSidebar(),
            'homeworkList' => $homeworkList
        ]);
    }
    
    /**
     * Create Homework
     */
    public function createHomework() {
        $classModel = new ClassModel();
        $classes = $classModel->findAll();
        
        $subjectModel = new Subject();
        $subjects = $subjectModel->findAll();
        
        $this->render('teacher/homework_form', [
            'pageTitle' => 'Create Homework - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getTeacherSidebar(),
            'classes' => $classes,
            'subjects' => $subjects,
            'homework' => null
        ]);
    }
    
    /**
     * Store Homework
     */
    public function storeHomework() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('teacher', 'homework');
        }
        
        $data = [
            'class_id' => $_POST['class_id'] ?? null,
            'subject_id' => $_POST['subject_id'] ?? null,
            'teacher_id' => Auth::id(),
            'title' => trim($_POST['title'] ?? ''),
            'description' => trim($_POST['description'] ?? ''),
            'due_date' => $_POST['due_date'] ?? null
        ];
        
        if (empty($data['title']) || !$data['class_id'] || !$data['subject_id']) {
            Session::setFlash('error', 'Please fill in all required fields.', 'error');
            $this->redirect('teacher', 'createHomework');
        }
        
        $homeworkModel = new Homework();
        
        try {
            $homeworkModel->insert($data);
            Session::setFlash('success', 'Homework created successfully!', 'success');
            $this->redirect('teacher', 'homework');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to create homework.', 'error');
            $this->redirect('teacher', 'createHomework');
        }
    }
    
    /**
     * Calculate grade from total score
     */
    private function calculateGrade($total) {
        if ($total >= 90) return 'A+';
        if ($total >= 80) return 'A';
        if ($total >= 70) return 'B';
        if ($total >= 60) return 'C';
        if ($total >= 50) return 'D';
        return 'F';
    }
    
    /**
     * Get teacher class count
     */
    private function getTeacherClassCount($teacherId) {
        // TODO: Implement teacher-class assignment
        return 3;
    }
    
    /**
     * Get teacher student count
     */
    private function getTeacherStudentCount($teacherId) {
        // TODO: Implement based on assigned classes
        return 45;
    }
    
    /**
     * Get teacher sidebar
     */
    private function getTeacherSidebar() {
        $currentAction = $_GET['a'] ?? 'dashboard';
        
        return [
            [
                'label' => 'Dashboard',
                'url' => APP_URL . '/index.php?c=teacher&a=dashboard',
                'icon' => 'fas fa-home',
                'active' => $currentAction === 'dashboard' ? 'active' : ''
            ],
            [
                'label' => 'My Classes',
                'url' => APP_URL . '/index.php?c=teacher&a=myClasses',
                'icon' => 'fas fa-chalkboard',
                'active' => $currentAction === 'myClasses' ? 'active' : ''
            ],
            [
                'label' => 'Attendance',
                'url' => APP_URL . '/index.php?c=teacher&a=myClasses',
                'icon' => 'fas fa-clipboard-check',
                'active' => $currentAction === 'attendance' ? 'active' : ''
            ],
            [
                'label' => 'Grades',
                'url' => APP_URL . '/index.php?c=teacher&a=myClasses',
                'icon' => 'fas fa-graduation-cap',
                'active' => $currentAction === 'grades' ? 'active' : ''
            ],
            [
                'label' => 'Homework',
                'url' => APP_URL . '/index.php?c=teacher&a=homework',
                'icon' => 'fas fa-book',
                'active' => $currentAction === 'homework' ? 'active' : ''
            ],
        ];
    }
}
