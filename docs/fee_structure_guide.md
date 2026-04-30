# Fee Structure Guide

## Overview

The fee structure system allows you to define fees for different classes, terms, and education levels. It's organized into three layers:

1. **Fee Groups** - Organize related fee items together (e.g., Tuition Fees, Books, Uniforms)
2. **Fee Items** - Individual fee items within groups (e.g., Tuition - Creche, Textbooks, Sports Kit)
3. **Fee Rules** - Connect fee items to specific classes, terms, and levels with amounts

## Step-by-Step Example: Setting Up Tuition for Creche Class

### Step 1: Create a Fee Group

First, create a group to organize tuition fees:

- **Group Code**: `TUITION` (unique identifier)
- **Group Name**: `Tuition Fees`
- **Group Description**: `Core tuition fees for all classes`

### Step 2: Create Fee Items

Create fee items for each class level within the group:

**Example Items:**
- **Item Code**: `TUITION-CRECHE`
- **Item Name**: `Tuition - Creche`
- **Item Description**: `Termly tuition for creche class`
- **Frequency**: `term` (can be: term, semester, year, monthly)
- **Optional**: `0` (required fee)

### Step 3: Create Fee Rules

Connect each fee item to specific classes, terms, and levels with amounts:

**Example Rule for Creche:**
- **Item**: Tuition - Creche
- **Class**: Creche (class_id from your classes table)
- **Term**: Term 1 (term_id from your terms table)
- **Level**: Creche (education level)
- **Amount**: 500 GHS
- **Currency**: GHS
- **Academic Year**: 2024/2025
- **Late Fee**: 10 GHS (charged if payment is late)
- **Late Fee Type**: `fixed` (can be: fixed, percentage)

## Complete Example: Full Fee Structure for a Class

### Scenario: Creche Class - Term 1

**1. Fee Group**
```
Group Code: TUITION
Group Name: Tuition Fees
Description: Core tuition fees
```

**2. Fee Items**
```
Item Code: TUITION-CRECHE
Item Name: Tuition - Creche
Description: Termly tuition for creche
Frequency: term
Optional: No
```

**3. Additional Fee Items (Optional)**
```
Item Code: BOOKS-CRECHE
Item Name: Textbooks - Creche
Description: Books and learning materials
Frequency: term
Optional: Yes
```

**4. Fee Rules**
```
Rule 1:
- Item: Tuition - Creche
- Class: Creche
- Term: Term 1
- Level: Creche
- Amount: 500 GHS
- Late Fee: 10 GHS

Rule 2:
- Item: Textbooks - Creche
- Class: Creche
- Term: Term 1
- Level: Creche
- Amount: 150 GHS
- Late Fee: 5 GHS
```

## CSV Template Format

The CSV template uses three row types to define the fee structure:

### Row 1: Headers
```
type,group_code,group_name,group_description,item_code,item_name,item_description,frequency,is_optional,class_id,class_name,term_id,term_name,level,amount,currency,academic_year,is_taxable,tax_rate,late_fee,late_fee_type
```

### Row 2: Group Definition
```
group,GROUP-001,Tuition Fees,Core tuition fees,,,,,,,,,,,,,,,,,,GHS,2024/2025,0,0,0,fixed
```

### Row 3: Item Definition
```
item,,Tuition - Creche,TUITION-CRECHE,Termly tuition for creche,term,0,,,,,,,,,GHS,2024/2025,0,0,0,fixed
```

### Row 4: Rule Definition
```
rule,,,,,,,creche,1,Creche,1,Term 1,creche,500,GHS,2024/2025,0,0,10,fixed
```

## Field Descriptions

### Group Fields
- **type**: `group`
- **group_code**: Unique identifier (e.g., TUITION, BOOKS)
- **group_name**: Display name (e.g., Tuition Fees)
- **group_description**: Description of the group

### Item Fields
- **type**: `item`
- **item_code**: Unique identifier (e.g., TUITION-CRECHE)
- **item_name**: Display name (e.g., Tuition - Creche)
- **item_description**: Description
- **frequency**: term, semester, year, monthly
- **is_optional**: 0 (required) or 1 (optional)

### Rule Fields
- **type**: `rule`
- **class_id**: ID from classes table
- **class_name**: Name of the class
- **term_id**: ID from terms table
- **term_name**: Name of the term
- **level**: Education level (e.g., creche, primary, jhs)
- **amount**: Fee amount
- **currency**: GHS, USD, etc.
- **academic_year**: 2024/2025
- **is_taxable**: 0 (no) or 1 (yes)
- **tax_rate**: Tax percentage (e.g., 5 for 5%)
- **late_fee**: Late fee amount
- **late_fee_type**: fixed or percentage

## Best Practices

1. **Use Consistent Naming**: Use a consistent naming convention for codes (e.g., TUITION-CRECHE, TUITION-PRIMARY)
2. **Group Related Items**: Group similar fees together (tuition items together, books together)
3. **Specify Frequency**: Always specify when the fee is charged (termly, monthly, etc.)
4. **Set Academic Year**: Always specify the academic year for the fee rule
5. **Define Late Fees**: Set appropriate late fees to encourage timely payments
6. **Use Levels**: Use levels to apply fees to multiple classes at once (e.g., all primary classes)

## Common Scenarios

### Scenario 1: Same Fee for Multiple Classes
Create one fee item and multiple rules for different classes:
```
Item: TUITION-PRIMARY
Rule 1: Class P1, Amount 600
Rule 2: Class P2, Amount 600
Rule 3: Class P3, Amount 600
```

### Scenario 2: Different Amounts for Different Terms
Create one fee item and multiple rules for different terms:
```
Item: TUITION-PRIMARY
Rule 1: Term 1, Amount 600
Rule 2: Term 2, Amount 600
Rule 3: Term 3, Amount 600
```

### Scenario 3: Optional Fees
Mark fee items as optional:
```
Item: SPORTS-KIT
Frequency: year
Optional: Yes
```

## Troubleshooting

**Issue**: Fee not appearing in invoice
- Check that the class, term, and academic year match
- Verify the fee rule is active (is_active = 1)
- Ensure the academic year is set as active in the system

**Issue**: Duplicate fees
- Check that you don't have multiple rules for the same item/class/term combination
- Use the "Cleanup Duplicates" feature in the fee structure management

**Issue**: Wrong amount charged
- Verify the amount in the fee rule
- Check if late fees are being applied
- Ensure discounts are not incorrectly applied
