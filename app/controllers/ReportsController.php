<?php
/**
 * Reports Controller
 */

class ReportsController extends Controller {
    
    public function __construct() {
        $this->requireRole(['admin', 'finance']);
    }
    
    public function index() {
        $this->render('reports/index', [
            'pageTitle' => 'Reports - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getReportsSidebar()
        ]);
    }
    
    private function getReportsSidebar() {
        return [
            ['label' => 'Reports Home', 'url' => APP_URL . '/index.php?c=reports&a=index', 'icon' => 'fas fa-chart-bar', 'active' => 'active'],
        ];
    }
}
