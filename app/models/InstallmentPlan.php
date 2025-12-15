<?php
class InstallmentPlan extends Model {
    protected $table = 'installment_plans';
    
    /**
     * Get all active installment plans
     */
    public function getActive() {
        $sql = "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY id ASC";
        return $this->query($sql);
    }
    
    /**
     * Get plan details as array
     */
    public function getPlanDetails($id) {
        $plan = $this->findById($id);
        if ($plan) {
            return json_decode($plan['plan_details'], true);
        }
        return null;
    }
    
    /**
     * Calculate installment amounts based on total
     */
    public function calculateInstallments($planId, $totalAmount) {
        $details = $this->getPlanDetails($planId);
        if (!$details) {
            return [];
        }
        
        $installments = [];
        $percentages = $details['percentages'] ?? [];
        $intervals = $details['intervals'] ?? [];
        
        foreach ($percentages as $index => $percentage) {
            $installments[] = [
                'percentage' => $percentage,
                'amount' => ($totalAmount * $percentage) / 100,
                'interval' => $intervals[$index] ?? 'unknown',
                'due_date' => $this->calculateDueDate($intervals[$index] ?? null)
            ];
        }
        
        return $installments;
    }
    
    /**
     * Calculate due date based on interval
     */
    private function calculateDueDate($interval) {
        $today = new DateTime();
        
        switch ($interval) {
            case 'term_start':
                return $today->format('Y-m-d');
            case 'mid_term':
                return $today->modify('+6 weeks')->format('Y-m-d');
            case 'end_term':
                return $today->modify('+12 weeks')->format('Y-m-d');
            case 'month_1':
                return $today->modify('+1 month')->format('Y-m-d');
            case 'month_2':
                return $today->modify('+2 months')->format('Y-m-d');
            case 'month_3':
                return $today->modify('+3 months')->format('Y-m-d');
            default:
                return $today->format('Y-m-d');
        }
    }
}
