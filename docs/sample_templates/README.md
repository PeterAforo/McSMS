# Bulk Import CSV Templates

These templates show the correct format for bulk importing data into McSMS.

## Field Guidelines

### Students Template
| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| First Name | Text | Yes | John | Student's first name |
| Last Name | Text | Yes | Smith | Student's surname |
| Middle Name | Text | No | Michael | Optional middle name |
| Date of Birth | Date | Yes | 2015-05-15 | Format: YYYY-MM-DD |
| Gender | Text | Yes | Male/Female | Must be Male or Female |
| Class | Text | No | Grade 1 | Use class NAME (e.g., "Grade 1", "Pre-Primary 2", "Toddler 1") |
| Admission Number | Text | No | STU001 | Auto-generated if empty |
| Email | Email | No | student@email.com | Student's email |
| Phone | Phone | No | +233241234567 | Include country code |
| Address | Text | No | 123 Main Street | Full address |
| Religion | Text | No | Christianity | Student's religion |
| Nationality | Text | No | Ghanaian | Default: Ghanaian |
| Guardian Name | Text | No | Mary Smith | Parent/Guardian full name |
| Guardian Phone | Phone | No | +233241234568 | Guardian's phone number |
| Guardian Email | Email | No | parent@email.com | Guardian's email |
| Previous School | Text | No | ABC Primary | Previous school attended |
| Health Info | Text | No | Allergic to peanuts | Allergies or medical conditions |

### Teachers Template
| Field | Type | Required | Example |
|-------|------|----------|---------|
| First Name | Text | Yes | Grace |
| Last Name | Text | Yes | Asante |
| Email | Email | Yes | teacher@school.com |
| Phone | Phone | Yes | +233241234567 |
| Employee ID | Text | No | TCH001 |
| Gender | Text | Yes | Male/Female |
| Date of Birth | Date | No | 1985-03-15 |
| Qualification | Text | No | B.Ed Education |
| Department | Text | No | Primary |

### Classes Template
| Field | Type | Required | Example |
|-------|------|----------|---------|
| Class Name | Text | Yes | Grade 1 |
| Class Code | Text | Yes | GR1 |
| Level | Text | Yes | PRIMARY/PRE-PRIMARY/TODDLER |
| Grade | Number | No | 1 |
| Section | Text | No | A |
| Capacity | Number | No | 30 |

### Subjects Template
| Field | Type | Required | Example |
|-------|------|----------|---------|
| Subject Name | Text | Yes | Mathematics |
| Subject Code | Text | Yes | MATH |
| Description | Text | No | Core mathematics |
| Credit Hours | Number | No | 4 |
| Is Elective | Text | No | Yes/No |

## Important Notes

1. **Class Field**: Use the class NAME (e.g., "Grade 1", "Pre-Primary 2"), NOT the database ID
2. **Date Format**: Use YYYY-MM-DD format (e.g., 2015-05-15)
3. **Phone Numbers**: Include country code (e.g., +233241234567)
4. **Required Fields**: Only First Name and Last Name are strictly required for students
5. **Duplicates**: System checks for duplicates by:
   - Admission Number
   - Name + Date of Birth
   - Guardian Phone
