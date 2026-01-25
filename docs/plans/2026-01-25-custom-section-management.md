# Custom Section Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to edit and delete custom sections from the CourseDetails panel.

**Architecture:** Add a "Custom Sections" list in CourseDetails that displays when a course has custom sections. Each section has edit/delete buttons. Edit opens the existing modal pre-filled; delete removes immediately.

**Tech Stack:** React, Tailwind CSS, Lucide icons

---

## Task 1: Add `updateCustomSection` to AppContext

**Files:**
- Modify: `src/context/AppContext.jsx`

**Step 1: Add function after `removeCustomSection` (around line 975)**

```javascript
// Update an existing custom section
const updateCustomSection = (courseId, sectionId, newData) => {
  setMyCourses(prevCourses => prevCourses.map(course => {
    if (course.course_id !== courseId) return course;

    return {
      ...course,
      customSections: (course.customSections || []).map(s =>
        s.id === sectionId ? { ...s, ...newData } : s
      )
    };
  }));
};
```

**Step 2: Export in context provider value**

Add `updateCustomSection,` to the provider value object.

**Step 3: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add updateCustomSection function to AppContext"
```

---

## Task 2: Update AddSectionModal for Edit Mode

**Files:**
- Modify: `src/components/AddSectionModal.jsx`

**Step 1: Update component signature to accept edit props**

```jsx
const AddSectionModal = ({ isOpen, onClose, onAdd, onUpdate, courseName, existingSection = null }) => {
```

**Step 2: Initialize state from existingSection if provided**

Replace the useState initializers:

```jsx
const [days, setDays] = useState({
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false
});
const [startTime, setStartTime] = useState("9:00am");
const [endTime, setEndTime] = useState("10:00am");
const [location, setLocation] = useState("");

// Reset form when modal opens/closes or existingSection changes
useEffect(() => {
  if (existingSection) {
    setDays(existingSection.days || {
      monday: false, tuesday: false, wednesday: false,
      thursday: false, friday: false, saturday: false, sunday: false
    });
    setStartTime(existingSection.startTime || "9:00am");
    setEndTime(existingSection.endTime || "10:00am");
    setLocation(existingSection.location || "");
  } else {
    setDays({
      monday: false, tuesday: false, wednesday: false,
      thursday: false, friday: false, saturday: false, sunday: false
    });
    setStartTime("9:00am");
    setEndTime("10:00am");
    setLocation("");
  }
}, [existingSection, isOpen]);
```

**Step 3: Add useEffect import at top**

```jsx
import { useState, useEffect } from "react";
```

**Step 4: Update handleSubmit to handle edit vs. add**

```jsx
const handleSubmit = (e) => {
  e.preventDefault();

  if (!Object.values(days).some(Boolean)) {
    return;
  }

  const sectionData = {
    days,
    startTime,
    endTime,
    location: location.trim() || null
  };

  if (existingSection && onUpdate) {
    onUpdate(existingSection.id, sectionData);
  } else {
    onAdd(sectionData);
  }

  onClose();
};
```

**Step 5: Update modal title and button text**

Change the title:
```jsx
<h2 className="text-lg font-semibold text-gray-900">
  {existingSection ? "Edit Section" : "Add Section"}
</h2>
```

Change the subtitle:
```jsx
<p className="text-sm text-gray-600 mb-4">
  {existingSection ? "Editing" : "Adding"} section for <span className="font-medium">{courseName}</span>
</p>
```

Change the submit button text:
```jsx
{existingSection ? "Save Changes" : "Add Section"}
```

**Step 6: Remove the form reset logic from handleSubmit (useEffect handles it now)**

Remove these lines from handleSubmit:
```jsx
// Reset form - REMOVE THESE LINES
setDays({...});
setStartTime("9:00am");
setEndTime("10:00am");
setLocation("");
```

**Step 7: Commit**

```bash
git add src/components/AddSectionModal.jsx
git commit -m "feat: support edit mode in AddSectionModal"
```

---

## Task 3: Add Custom Sections List to CourseDetails

**Files:**
- Modify: `src/components/CourseDetails.jsx`

**Step 1: Import Pencil and Trash2 icons**

Update the lucide-react import:
```jsx
import { Clock, Star, Plus, Minus, ChevronDown, Users, ChevronUp, CalendarPlus, Pencil, Trash2 } from "lucide-react";
```

**Step 2: Add updateCustomSection and removeCustomSection to context destructuring**

```jsx
const { selectedCourse, myCourses, addCourse, removeCourse, updateCourseSection, addCustomSection, updateCustomSection, removeCustomSection, filters, setFilters } = useAppContext();
```

**Step 3: Add state for editing section**

After `showAddSectionModal` state:
```jsx
const [editingSection, setEditingSection] = useState(null);
```

**Step 4: Get custom sections from the course in myCourses**

After `const isAdded = ...`:
```jsx
// Get custom sections for this course (from myCourses, not selectedCourse)
const courseInCalendar = myCourses.find(c => c.course_id === selectedCourse.course_id);
const customSections = courseInCalendar?.customSections || [];
```

**Step 5: Add handlers for edit and delete**

After `handleAddCustomSection`:
```jsx
const handleEditSection = (section) => {
  setEditingSection(section);
  setShowAddSectionModal(true);
};

const handleUpdateSection = (sectionId, sectionData) => {
  updateCustomSection(selectedCourse.course_id, sectionId, sectionData);
  setEditingSection(null);
};

const handleDeleteSection = (sectionId) => {
  removeCustomSection(selectedCourse.course_id, sectionId);
};

const handleCloseModal = () => {
  setShowAddSectionModal(false);
  setEditingSection(null);
};
```

**Step 6: Add Custom Sections list UI**

After the button container div (after line ~350), add:

```jsx
{/* Custom Sections List */}
{isAdded && customSections.length > 0 && (
  <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
    <div className="text-sm font-medium text-gray-700 mb-2">Custom Sections</div>
    <div className="space-y-2">
      {customSections.map((section) => {
        const dayAbbrevs = { monday: 'M', tuesday: 'Tu', wednesday: 'W', thursday: 'Th', friday: 'F', saturday: 'Sa', sunday: 'Su' };
        const daysStr = Object.entries(section.days || {})
          .filter(([_, active]) => active)
          .map(([day]) => dayAbbrevs[day])
          .join(' ');

        return (
          <div key={section.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
            <div className="text-sm">
              <span className="font-medium">{daysStr}</span>
              <span className="text-gray-600 ml-2">{section.startTime}-{section.endTime}</span>
              {section.location && (
                <span className="text-gray-500 ml-2">• {section.location}</span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEditSection(section)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Edit section"
              >
                <Pencil size={14} className="text-gray-500" />
              </button>
              <button
                onClick={() => handleDeleteSection(section.id)}
                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                title="Delete section"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

**Step 7: Update AddSectionModal props**

Change the modal at the bottom from:
```jsx
<AddSectionModal
  isOpen={showAddSectionModal}
  onClose={() => setShowAddSectionModal(false)}
  onAdd={handleAddCustomSection}
  courseName={selectedCourse.subject_catalog}
/>
```

To:
```jsx
<AddSectionModal
  isOpen={showAddSectionModal}
  onClose={handleCloseModal}
  onAdd={handleAddCustomSection}
  onUpdate={handleUpdateSection}
  courseName={selectedCourse.subject_catalog}
  existingSection={editingSection}
/>
```

**Step 8: Commit**

```bash
git add src/components/CourseDetails.jsx
git commit -m "feat: add custom sections list with edit/delete in CourseDetails"
```

---

## Task 4: Final Testing

**Step 1: Test add multiple sections**
1. Add a course
2. Click "Add section" → add Mon/Wed 9-10am
3. Click "Add section" again → add Tue/Thu 2-3pm
4. Verify both appear in the list and on the calendar

**Step 2: Test edit section**
1. Click the pencil icon on a section
2. Verify modal opens with pre-filled data
3. Change the time, click "Save Changes"
4. Verify the section updates in the list and on the calendar

**Step 3: Test delete section**
1. Click the trash icon on a section
2. Verify it disappears immediately from list and calendar

**Step 4: Test persistence**
1. Add sections, edit one, delete one
2. Refresh the page
3. Verify all changes persisted

**Step 5: Commit if any fixes needed**

```bash
git add -A
git commit -m "feat: complete custom section management"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add updateCustomSection function | AppContext.jsx |
| 2 | Support edit mode in modal | AddSectionModal.jsx |
| 3 | Add sections list with edit/delete | CourseDetails.jsx |
| 4 | Integration testing | - |
